package citu.stde.service;

import citu.stde.dto.EvaluationDTO;
import citu.stde.dto.EvaluationResponse;
import citu.stde.entity.Document;
import citu.stde.entity.DocumentStatus;
import citu.stde.entity.Evaluation;
import citu.stde.repository.DocumentRepository;
import citu.stde.repository.EvaluationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // Toggle for content truncation
    private final boolean ENABLE_TRUNCATION = false; // Set to false to send full content to AI

    @Transactional
    public EvaluationDTO evaluateDocument(UUID documentId, UUID userId) {
        // 1. Fetch Document
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!doc.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized access to document");
        }

        // 2. Validate Document Type (AI-based detection)
        String safeContent = truncateContent(doc.getContent());
        if (!isValidSoftwareTestingDocument(safeContent)) {
            throw new IllegalArgumentException("TYPE:INVALID_DOCUMENT|The uploaded document is not a Software Testing Document. Please upload a valid test plan, test case, or test strategy document.");
        }

        // 3. Handle Re-evaluation (Fixes "Duplicate Key" error)
        Optional<Evaluation> existingEval = evaluationRepository.findByDocumentId(documentId);
        if (existingEval.isPresent()) {
            evaluationRepository.delete(existingEval.get());
            evaluationRepository.flush(); // Ensure deletion happens before new insert
        }

        doc.setStatus(DocumentStatus.PROCESSING);
        documentRepository.save(doc);

        try {
            ChatClient chatClient = chatClientBuilder.build();
            
            // STRICT JSON INSTRUCTIONS
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
            
            // 4. Smart Error Classification
            String errorMsg = e.getMessage().toLowerCase();
            
            if (errorMsg.contains("429") || errorMsg.contains("rate limit") || errorMsg.contains("quota")) {
                throw new RuntimeException("TYPE:RATE_LIMIT|AI is currently busy (Rate Limit). Please wait 30 seconds.");
            }
            if (e instanceof DataIntegrityViolationException) {
                throw new RuntimeException("TYPE:DUPLICATE|This document has already been evaluated.");
            }
            
            System.err.println("Backend Error: " + e.getMessage());
            throw new RuntimeException("TYPE:SERVER_ERROR|Internal processing failed: " + e.getMessage());
        }
    }

    /**
     * AI-based validation to check if the document is a Software Testing Document
     */
    private boolean isValidSoftwareTestingDocument(String content) {
        try {
            ChatClient chatClient = chatClientBuilder.build();
            
            String validationPrompt = """
                You are a document classifier. Analyze the following document and determine if it is a Software Testing Document.
                
                A Software Testing Document includes:
                - Test Plans
                - Test Cases
                - Test Scenarios
                - Test Strategies
                - Test Scripts
                - QA Documentation
                
                It is NOT:
                - Software Requirements Specification (SRS)
                - Design Documents
                - User Manuals
                - Project Plans
                - General documentation
                
                Respond with ONLY "YES" if it is a Software Testing Document, or "NO" if it is not.
                Do not include any explanation or additional text.
                """;

            String aiResponse = chatClient.prompt()
                    .system(validationPrompt)
                    .user(u -> u.text("Document Content:\n{content}")
                            .param("content", content))
                    .call()
                    .content();

            return aiResponse != null && aiResponse.trim().equalsIgnoreCase("YES");
            
        } catch (Exception e) {
            System.err.println("Document validation error: " + e.getMessage());
            // If validation fails, allow the document to proceed (fail-open approach)
            // You can change this to 'return false' for a fail-closed approach
            return true;
        }
    }

    /**
     * Helper: Truncate large texts to avoid token limits
     * Can be toggled on/off using ENABLE_TRUNCATION field
     */
    private String truncateContent(String content) {
        if (content == null) return "";
        
        // If truncation is disabled, return full content
        if (!ENABLE_TRUNCATION) {
            return content;
        }
        
        // 15,000 chars is roughly 3,000-4,000 tokens (well within the 20k limit)
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