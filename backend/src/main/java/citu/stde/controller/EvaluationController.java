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
    public ResponseEntity<?> evaluateDocument(
            @PathVariable UUID documentId,
            Authentication authentication) {
        try {
            UUID userId = getUserId(authentication);
            return ResponseEntity.ok(evaluationService.evaluateDocument(documentId, userId));
        } catch (RuntimeException e) {
            // Check for our custom Quota error
            if (e.getMessage().contains("TYPE:QUOTA_EXCEEDED")) {
                String cleanMessage = e.getMessage().replace("TYPE:QUOTA_EXCEEDED|", "");
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", cleanMessage));
            }
            throw e;
        }
    }

    // Get Usage Stats
    @GetMapping("/usage")
    public ResponseEntity<?> getUsageStats(Authentication authentication) {
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(evaluationService.getUsageStats(userId));
    }

    @GetMapping("/document/{documentId}")
    public ResponseEntity<EvaluationDTO> getEvaluation(
            @PathVariable UUID documentId,
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(evaluationService.getEvaluationByDocumentId(documentId, userId));
    }

    @GetMapping("/user")
    public ResponseEntity<List<EvaluationDTO>> getUserEvaluations(Authentication authentication) {
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(evaluationService.getUserEvaluations(userId));
    }

    @PutMapping("/override/{documentId}")
    public ResponseEntity<?> overrideEvaluation(
            @PathVariable UUID documentId,
            @RequestBody OverrideRequest request, 
            Authentication authentication) {
        try {
            UUID teacherId = getUserId(authentication);
            EvaluationDTO updatedEval = evaluationService.overrideEvaluationScore(
                documentId, teacherId, request.overallScore()
            );
            return ResponseEntity.ok(Map.of("message", "Score overridden", "evaluation", updatedEval));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    public record OverrideRequest(Integer overallScore) {}

    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.getIdByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}