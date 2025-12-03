package citu.stde.controller;

import citu.stde.dto.EvaluationDTO;
import citu.stde.repository.UserRepository;
import citu.stde.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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
            
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(evaluationService.getEvaluationByDocumentId(documentId, userId));
    }

    @GetMapping("/user")
    public ResponseEntity<List<EvaluationDTO>> getUserEvaluations(Authentication authentication) {
        UUID userId = getUserId(authentication);
        return ResponseEntity.ok(evaluationService.getUserEvaluations(userId));
    }

    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.getIdByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}