package citu.stde.service;

import citu.stde.dto.EvaluationDTO;
import citu.stde.dto.EvaluationResponse;
import citu.stde.entity.Document;
import citu.stde.entity.DocumentStatus;
import citu.stde.entity.Evaluation;
import citu.stde.entity.User;
import citu.stde.repository.DocumentRepository;
import citu.stde.repository.EvaluationRepository;
import citu.stde.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final ChatClient.Builder chatClientBuilder;
    private final DocumentRepository documentRepository;
    private final EvaluationRepository evaluationRepository;
    private final GoogleDriveService googleDriveService;
    private final ClassroomService classroomService; 
    private final UserRepository userRepository;

    // ==========================================
    // DEV SETTINGS (Toggle here for testing)
    // ==========================================
    private final boolean ENABLE_TRUNCATION = false; // Set 'true' to save tokens
    private static final int HOURLY_LIMIT = 30;      // Dev limit increased to 30
    // ==========================================

    @Transactional
    public EvaluationDTO evaluateDocument(UUID documentId, UUID userId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        
        if (!doc.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to document");
        }

        checkAndIncrementUsage(userId);

        doc.setStatus(DocumentStatus.PROCESSING);
        documentRepository.save(doc);

        try {
            String fileContent = fetchFileContentFromDrive(doc);
            String currentHash = calculateHash(fileContent);
            doc.setContentHash(currentHash);
            documentRepository.save(doc);

            Optional<Evaluation> cachedEval = evaluationRepository
                .findTopByUserIdAndDocument_ContentHashOrderByCreatedAtDesc(userId, currentHash);

            if (cachedEval.isPresent()) {
                System.out.println("Duplicate content detected. Returning cached result.");
                return copyCachedEvaluation(cachedEval.get(), doc, userId);
            }

            String safeContent = truncateContent(fileContent);
            if (!isValidSoftwareTestingDocument(safeContent)) {
                throw new IllegalArgumentException("TYPE:INVALID_DOCUMENT|The uploaded document is not a Software Testing Document.");
            }

            Optional<Evaluation> existingEval = evaluationRepository.findByDocumentId(documentId);
            if (existingEval.isPresent()) {
                evaluationRepository.delete(existingEval.get());
                evaluationRepository.flush();
            }

            ChatClient chatClient = chatClientBuilder.build();
            String systemPrompt = """
                You are a strict QA Auditor. Evaluate the software test document on 4 criteria.
                You MUST return a valid JSON object. Do not add markdown blocks.
                
                Use EXACTLY these keys:
                {
                    "completenessScore": (Integer 0-100),
                    "completenessFeedback": (String),
                    "clarityScore": (Integer 0-100),
                    "clarityFeedback": (String),
                    "consistencyScore": (Integer 0-100),
                    "consistencyFeedback": (String),
                    "verificationScore": (Integer 0-100),
                    "verificationFeedback": (String),
                    "overallScore": (Integer 0-100),
                    "overallFeedback": (String)
                }
                """;

            EvaluationResponse aiResponse = chatClient.prompt()
                    .system(systemPrompt)
                    .user(u -> u.text("Document Content:\n{content}").param("content", safeContent))
                    .call()
                    .entity(EvaluationResponse.class);

            if (aiResponse.completenessScore() == null) {
                throw new RuntimeException("AI returned null scores.");
            }

            Evaluation evaluation = mapToEntity(aiResponse, doc, userId);
            Evaluation savedEval = evaluationRepository.save(evaluation);

            doc.setStatus(DocumentStatus.COMPLETED);
            documentRepository.save(doc);

            return mapToDTO(savedEval, doc.getFilename());

        } catch (Exception e) {
            doc.setStatus(DocumentStatus.FAILED);
            documentRepository.save(doc);
            
            String errorMsg = e.getMessage().toLowerCase();
            if (errorMsg.contains("429") || errorMsg.contains("rate limit")) {
                throw new RuntimeException("TYPE:RATE_LIMIT|AI is busy. Please wait 30 seconds.");
            }
            if (e.getMessage().startsWith("TYPE:")) {
                throw new RuntimeException(e.getMessage());
            }
            
            System.err.println("Backend Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("TYPE:SERVER_ERROR|Internal processing failed: " + e.getMessage());
        }
    }

    private void checkAndIncrementUsage(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Instant now = Instant.now();
        Instant windowStart = user.getEvaluationWindowStart();

        // Null Safety: Treat null count as 0
        int currentCount = user.getEvaluationCount() == null ? 0 : user.getEvaluationCount();

        if (windowStart == null || windowStart.plus(1, ChronoUnit.HOURS).isBefore(now)) {
            user.setEvaluationWindowStart(now);
            user.setEvaluationCount(0);
            windowStart = now;
            currentCount = 0;
        }

        if (currentCount >= HOURLY_LIMIT) {
            long minutesLeft = ChronoUnit.MINUTES.between(now, windowStart.plus(1, ChronoUnit.HOURS));
            throw new RuntimeException("TYPE:QUOTA_EXCEEDED|You have used all " + HOURLY_LIMIT + " analysis attempts for this hour. Resets in " + minutesLeft + " minutes.");
        }

        user.setEvaluationCount(currentCount + 1);
        userRepository.save(user);
    }

    public Map<String, Object> getUsageStats(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Instant now = Instant.now();
        Instant windowStart = user.getEvaluationWindowStart();
        
        int currentCount = user.getEvaluationCount() == null ? 0 : user.getEvaluationCount();

        if (windowStart == null || windowStart.plus(1, ChronoUnit.HOURS).isBefore(now)) {
            currentCount = 0;
            windowStart = now; 
        }

        long secondsRemaining = 0;
        if (windowStart != null) {
            Instant resetTime = windowStart.plus(1, ChronoUnit.HOURS);
            secondsRemaining = Math.max(0, ChronoUnit.SECONDS.between(now, resetTime));
        }

        // Returns the HOURLY_LIMIT constant, so frontend updates automatically
        return Map.of(
            "used", currentCount,
            "limit", HOURLY_LIMIT, 
            "remaining", Math.max(0, HOURLY_LIMIT - currentCount),
            "resetInSeconds", secondsRemaining
        );
    }

    private String calculateHash(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return null;
        }
    }

    private EvaluationDTO copyCachedEvaluation(Evaluation cached, Document currentDoc, UUID userId) {
        Evaluation newEval = Evaluation.builder()
                .document(currentDoc)
                .userId(userId)
                .completenessScore(cached.getCompletenessScore())
                .completenessFeedback(cached.getCompletenessFeedback())
                .clarityScore(cached.getClarityScore())
                .clarityFeedback(cached.getClarityFeedback())
                .consistencyScore(cached.getConsistencyScore())
                .consistencyFeedback(cached.getConsistencyFeedback())
                .verificationScore(cached.getVerificationScore())
                .verificationFeedback(cached.getVerificationFeedback())
                .overallScore(cached.getOverallScore())
                .overallFeedback(cached.getOverallFeedback() + " (Note: Result retrieved from cache as content is identical to previous submission.)")
                .build();

        Evaluation saved = evaluationRepository.save(newEval);
        currentDoc.setStatus(DocumentStatus.COMPLETED);
        documentRepository.save(currentDoc);
        return mapToDTO(saved, currentDoc.getFilename());
    }

    @Transactional
    public EvaluationDTO overrideEvaluationScore(UUID documentId, UUID teacherId, Integer newScore) {
        if (newScore == null || newScore < 0 || newScore > 100) throw new IllegalArgumentException("Score must be between 0 and 100.");
        Document doc = documentRepository.findById(documentId).orElseThrow(() -> new IllegalArgumentException("Document not found."));
        UUID classId = doc.getClassroom() != null ? doc.getClassroom().getId() : null;
        if (classId == null) throw new SecurityException("Security check failed: Document is not linked to any class.");
        classroomService.verifyClassroomOwnership(classId, teacherId);
        Evaluation eval = evaluationRepository.findByDocumentId(documentId).orElseGet(() -> Evaluation.builder().document(doc).userId(doc.getUser().getId()).build());
        eval.setOverallScore(newScore);
        eval.setCompletenessScore(newScore);
        eval.setClarityScore(newScore);
        eval.setConsistencyScore(newScore);
        eval.setVerificationScore(newScore);
        eval.setOverallFeedback("Score manually overridden by Professor.");
        Evaluation savedEval = evaluationRepository.save(eval);
        doc.setStatus(DocumentStatus.COMPLETED); 
        documentRepository.save(doc);
        return mapToDTO(savedEval, doc.getFilename());
    }

    public EvaluationDTO getEvaluationByDocumentId(UUID documentId, UUID userId) {
        Evaluation eval = evaluationRepository.findByDocumentId(documentId).orElseThrow(() -> new IllegalArgumentException("Evaluation report not found."));
        Document doc = eval.getDocument();
        UUID classId = doc.getClassroom() != null ? doc.getClassroom().getId() : null;
        boolean isOwner = doc.getUser().getId().equals(userId);
        boolean isTeacherOfClass = false;
        if (classId != null) {
            try { classroomService.verifyClassroomOwnership(classId, userId); isTeacherOfClass = true; } catch (SecurityException e) { }
        }
        if (!isOwner && !isTeacherOfClass) throw new SecurityException("Unauthorized");
        return mapToDTO(eval, doc.getFilename());
    }
    
    private String fetchFileContentFromDrive(Document doc) throws IOException {
        String driveFileId = doc.getDriveFileId();
        if (driveFileId == null || driveFileId.isEmpty()) throw new IllegalArgumentException("Document is missing Google Drive File ID");
        try (InputStream inputStream = googleDriveService.downloadFile(driveFileId)) {
            String contentType = doc.getFileType();
            if ("application/pdf".equals(contentType)) return extractTextFromPDF(inputStream);
            else if ("application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType)) return extractTextFromDOCX(inputStream);
            else return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private String extractTextFromPDF(InputStream inputStream) throws IOException {
        try (PDDocument document = PDDocument.load(inputStream)) { return new PDFTextStripper().getText(document); }
    }

    private String extractTextFromDOCX(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream)) { return new XWPFWordExtractor(document).getText(); }
    }

    private boolean isValidSoftwareTestingDocument(String content) {
        try {
            ChatClient chatClient = chatClientBuilder.build();
            String validationPrompt = "Respond with ONLY \"YES\" if it is a Software Testing Document, or \"NO\".";
            String aiResponse = chatClient.prompt().system(validationPrompt).user(u -> u.text(content)).call().content();
            return aiResponse != null && aiResponse.trim().equalsIgnoreCase("YES");
        } catch (Exception e) { return true; }
    }

    private String truncateContent(String content) {
        if (!ENABLE_TRUNCATION || content == null) return content;
        return content.length() > 15000 ? content.substring(0, 15000) : content;
    }

    public List<EvaluationDTO> getUserEvaluations(UUID userId) {
        return evaluationRepository.findByUserId(userId).stream().map(eval -> mapToDTO(eval, eval.getDocument().getFilename())).collect(Collectors.toList());
    }

    private Evaluation mapToEntity(EvaluationResponse response, Document doc, UUID userId) {
        return Evaluation.builder().document(doc).userId(userId).completenessScore(response.completenessScore()).completenessFeedback(response.completenessFeedback()).clarityScore(response.clarityScore()).clarityFeedback(response.clarityFeedback()).consistencyScore(response.consistencyScore()).consistencyFeedback(response.consistencyFeedback()).verificationScore(response.verificationScore()).verificationFeedback(response.verificationFeedback()).overallScore(response.overallScore()).overallFeedback(response.overallFeedback()).build();
    }

    private EvaluationDTO mapToDTO(Evaluation eval, String filename) {
        return EvaluationDTO.builder().id(eval.getId()).documentId(eval.getDocument().getId()).filename(filename).completenessScore(eval.getCompletenessScore()).completenessFeedback(eval.getCompletenessFeedback()).clarityScore(eval.getClarityScore()).clarityFeedback(eval.getClarityFeedback()).consistencyScore(eval.getConsistencyScore()).consistencyFeedback(eval.getConsistencyFeedback()).verificationScore(eval.getVerificationScore()).verificationFeedback(eval.getVerificationFeedback()).overallScore(eval.getOverallScore()).overallFeedback(eval.getOverallFeedback()).createdAt(eval.getCreatedAt()).build();
    }
}