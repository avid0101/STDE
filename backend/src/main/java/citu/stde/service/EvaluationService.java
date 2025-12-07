package citu.stde.service;

import citu.stde.dto.EvaluationDTO;
import citu.stde.dto.EvaluationResponse;
import citu.stde.entity.Document;
import citu.stde.entity.DocumentStatus;
import citu.stde.entity.Evaluation;
import citu.stde.repository.DocumentRepository;
import citu.stde.repository.EvaluationRepository;
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
import java.util.HexFormat;
import java.util.List;
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

    private final boolean ENABLE_TRUNCATION = false;

    @Transactional
    public EvaluationDTO evaluateDocument(UUID documentId, UUID userId) {
        // 1. Fetch Document Metadata
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        
        if (!doc.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to document");
        }

        doc.setStatus(DocumentStatus.PROCESSING);
        documentRepository.save(doc);

        try {
            // 2. Fetch File Content from Google Drive
            String fileContent = fetchFileContentFromDrive(doc);

            // Calculate Hash & Check for Duplicates (Strategy 1)
            String currentHash = calculateHash(fileContent);
            doc.setContentHash(currentHash);
            documentRepository.save(doc); // Save hash immediately

            // Check if this user has already analyzed this exact content
            Optional<Evaluation> cachedEval = evaluationRepository
                .findTopByUserIdAndDocument_ContentHashOrderByCreatedAtDesc(userId, currentHash);

            if (cachedEval.isPresent()) {
                System.out.println("Duplicate content detected. Returning cached result for doc ID: " + documentId);
                return copyCachedEvaluation(cachedEval.get(), doc, userId);
            }

            // 3. Validate Document Type
            String safeContent = truncateContent(fileContent);
            if (!isValidSoftwareTestingDocument(safeContent)) {
                throw new IllegalArgumentException("TYPE:INVALID_DOCUMENT|The uploaded document is not a Software Testing Document.");
            }

            // 4. Handle Re-evaluation (Cleanup old eval for THIS document ID)
            Optional<Evaluation> existingEval = evaluationRepository.findByDocumentId(documentId);
            if (existingEval.isPresent()) {
                evaluationRepository.delete(existingEval.get());
                evaluationRepository.flush();
            }

            // 5. Perform AI Evaluation
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
            // Propagate custom exceptions (like INVALID_DOCUMENT) directly
            if (e.getMessage().startsWith("TYPE:")) {
                throw new RuntimeException(e.getMessage());
            }
            
            System.err.println("Backend Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("TYPE:SERVER_ERROR|Internal processing failed: " + e.getMessage());
        }
    }

    // Helper to calculate SHA-256 Hash
    private String calculateHash(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            System.err.println("Hash calculation failed: " + e.getMessage());
            return null; // Fail open (allow processing) if hash fails
        }
    }

    // Create a new Evaluation entry from a Cached one (Cost: 0 Tokens)
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
        if (newScore == null || newScore < 0 || newScore > 100) {
            throw new IllegalArgumentException("Score must be between 0 and 100.");
        }

        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new IllegalArgumentException("Document not found."));

        UUID classId = doc.getClassroom() != null ? doc.getClassroom().getId() : null;
        if (classId == null) {
             throw new SecurityException("Security check failed: Document is not linked to any class.");
        }
        classroomService.verifyClassroomOwnership(classId, teacherId);

        Evaluation eval = evaluationRepository.findByDocumentId(documentId)
            .orElseGet(() -> Evaluation.builder().document(doc).userId(doc.getUser().getId()).build());

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
        Evaluation eval = evaluationRepository.findByDocumentId(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Evaluation report not found."));
        
        Document doc = eval.getDocument();
        UUID classId = doc.getClassroom() != null ? doc.getClassroom().getId() : null;

        boolean isOwner = doc.getUser().getId().equals(userId);
        boolean isTeacherOfClass = false;
        
        if (classId != null) {
            try {
                classroomService.verifyClassroomOwnership(classId, userId);
                isTeacherOfClass = true;
            } catch (SecurityException e) {
                // Not the teacher
            }
        }
        
        if (!isOwner && !isTeacherOfClass) {
            throw new SecurityException("Unauthorized: User is neither the document owner nor the class teacher.");
        }
        
        return mapToDTO(eval, doc.getFilename());
    }
    
    // ====================================================================================
    // | PRIVATE HELPER METHODS
    // ====================================================================================

    private String fetchFileContentFromDrive(Document doc) throws IOException {
        String driveFileId = doc.getDriveFileId();
        if (driveFileId == null || driveFileId.isEmpty()) {
            throw new IllegalArgumentException("Document is missing Google Drive File ID");
        }

        try (InputStream inputStream = googleDriveService.downloadFile(driveFileId)) {
            String contentType = doc.getFileType();
            
            if ("application/pdf".equals(contentType)) {
                return extractTextFromPDF(inputStream);
            } else if ("application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType)) {
                return extractTextFromDOCX(inputStream);
            } else if ("text/plain".equals(contentType)) {
                return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            } else {
                throw new IllegalArgumentException("Unsupported file type: " + contentType);
            }
        }
    }

    private String extractTextFromPDF(InputStream inputStream) throws IOException {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractTextFromDOCX(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private boolean isValidSoftwareTestingDocument(String content) {
        try {
            ChatClient chatClient = chatClientBuilder.build();
            String validationPrompt = """
                You are a document classifier. Analyze the following document and determine if it is a Software Testing Document.
                Respond with ONLY "YES" if it is a Software Testing Document, or "NO" if it is not.
                """;
            String aiResponse = chatClient.prompt()
                    .system(validationPrompt)
                    .user(u -> u.text("Document Content:\n{content}").param("content", content))
                    .call()
                    .content();
            return aiResponse != null && aiResponse.trim().equalsIgnoreCase("YES");
        } catch (Exception e) {
            System.err.println("Document validation error: " + e.getMessage());
            return true;
        }
    }

    private String truncateContent(String content) {
        if (content == null) return "";
        if (!ENABLE_TRUNCATION) return content;
        int maxLength = 15000; 
        if (content.length() > maxLength) {
            return content.substring(0, maxLength) + "\n... [CONTENT TRUNCATED FOR AI ANALYSIS] ...";
        }
        return content;
    }

    public List<EvaluationDTO> getUserEvaluations(UUID userId) {
        return evaluationRepository.findByUserId(userId).stream()
                .map(eval -> mapToDTO(eval, eval.getDocument().getFilename()))
                .collect(Collectors.toList());
    }

    private Evaluation mapToEntity(EvaluationResponse response, Document doc, UUID userId) {
        return Evaluation.builder()
                .document(doc)
                .userId(userId) 
                .completenessScore(response.completenessScore())
                .completenessFeedback(response.completenessFeedback())
                .clarityScore(response.clarityScore())
                .clarityFeedback(response.clarityFeedback())
                .consistencyScore(response.consistencyScore())
                .consistencyFeedback(response.consistencyFeedback())
                .verificationScore(response.verificationScore())
                .verificationFeedback(response.verificationFeedback())
                .overallScore(response.overallScore())
                .overallFeedback(response.overallFeedback())
                .build();
    }

    private EvaluationDTO mapToDTO(Evaluation eval, String filename) {
        return EvaluationDTO.builder()
                .id(eval.getId())
                .documentId(eval.getDocument().getId())
                .filename(filename)
                .completenessScore(eval.getCompletenessScore())
                .completenessFeedback(eval.getCompletenessFeedback())
                .clarityScore(eval.getClarityScore())
                .clarityFeedback(eval.getClarityFeedback())
                .consistencyScore(eval.getConsistencyScore())
                .consistencyFeedback(eval.getConsistencyFeedback())
                .verificationScore(eval.getVerificationScore())
                .verificationFeedback(eval.getVerificationFeedback())
                .overallScore(eval.getOverallScore())
                .overallFeedback(eval.getOverallFeedback())
                .createdAt(eval.getCreatedAt())
                .build();
    }
}