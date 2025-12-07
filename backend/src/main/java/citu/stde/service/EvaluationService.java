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

    // Toggle for content truncation
    private final boolean ENABLE_TRUNCATION = false;

    @Transactional
    public EvaluationDTO evaluateDocument(UUID documentId, UUID userId) {
        // 1. Fetch Document Metadata from DB
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        if (!doc.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to document");
        }

        // Update status to processing
        doc.setStatus(DocumentStatus.PROCESSING);
        documentRepository.save(doc);

        try {
            // 2. Fetch File Content from Google Drive
            String fileContent = fetchFileContentFromDrive(doc);

            // 3. Validate Document Type (AI-based detection)
            String safeContent = truncateContent(fileContent);
            if (!isValidSoftwareTestingDocument(safeContent)) {
                throw new IllegalArgumentException("TYPE:INVALID_DOCUMENT|The uploaded document is not a Software Testing Document. Please upload a valid test plan, test case, or test strategy document.");
            }

            // 4. Handle Re-evaluation (Fixes "Duplicate Key" error)
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
                    .user(u -> u.text("Document Content:\n{content}")
                            .param("content", safeContent))
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
            
            // Smart Error Classification
            String errorMsg = e.getMessage().toLowerCase();
            
            if (errorMsg.contains("429") || errorMsg.contains("rate limit") || errorMsg.contains("quota")) {
                throw new RuntimeException("TYPE:RATE_LIMIT|AI is currently busy (Rate Limit). Please wait 30 seconds.");
            }
            if (e instanceof DataIntegrityViolationException) {
                throw new RuntimeException("TYPE:DUPLICATE|This document has already been evaluated.");
            }
            
            System.err.println("Backend Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("TYPE:SERVER_ERROR|Internal processing failed: " + e.getMessage());
        }
    }

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

    public EvaluationDTO getEvaluationByDocumentId(UUID documentId, UUID userId) {
        Evaluation eval = evaluationRepository.findByDocumentId(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Evaluation not found"));
        if (!eval.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized");
        }
        return mapToDTO(eval, eval.getDocument().getFilename());
    }

    private Evaluation mapToEntity(EvaluationResponse response, Document doc, UUID userId) {
        return Evaluation.builder()
                .document(doc)
                .userId(userId) // If Evaluation entity uses User object, this line might need update later
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