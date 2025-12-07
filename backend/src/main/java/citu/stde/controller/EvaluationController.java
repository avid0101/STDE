package citu.stde.controller;

import citu.stde.dto.EvaluationDTO;
import citu.stde.repository.UserRepository;
import citu.stde.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus; 
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;
    private final UserRepository userRepository;

    @PostMapping("/evaluate/{documentId}")
    public ResponseEntity<EvaluationDTO> evaluateDocument(
            @PathVariable UUID documentId,
            Authentication authentication) {
        
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(evaluationService.evaluateDocument(documentId, userId));
    }

    @GetMapping("/document/{documentId}")
    public ResponseEntity<EvaluationDTO> getEvaluation(
            @PathVariable UUID documentId,
            Authentication authentication) {
            
        // Note: The service layer handles security (checking if user owns document/class)
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(evaluationService.getEvaluationByDocumentId(documentId, userId));
    }

    @GetMapping("/user")
    public ResponseEntity<List<EvaluationDTO>> getUserEvaluations(Authentication authentication) {
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(evaluationService.getUserEvaluations(userId));
    }

    //Endpoint for Professor to Override Score (Requirement 7.2.3)
    @PutMapping("/override/{documentId}")
    public ResponseEntity<?> overrideEvaluation(
            @PathVariable UUID documentId,
            @RequestBody OverrideRequest request, // Use the dedicated record/class
            Authentication authentication) {
        try {
            // 1. Get the current Professor's ID
            UUID teacherId = getUserId(authentication);
            
            // 2. Call the service to update the score and perform security check
            EvaluationDTO updatedEval = evaluationService.overrideEvaluationScore(
                documentId, 
                teacherId, 
                request.overallScore()
            );

            return ResponseEntity.ok(Map.of(
                "message", "Evaluation score overridden successfully",
                "evaluation", updatedEval
            ));

        } catch (SecurityException e) {
            // Teacher is not the owner of the class
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            // Document or Evaluation not found
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Override failed: " + e.getMessage()));
        }
    }

    // Record to cleanly map the incoming JSON body: { "overallScore": 95 }
    public record OverrideRequest(Integer overallScore) {}


    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.getIdByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}