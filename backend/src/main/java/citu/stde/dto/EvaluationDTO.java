package citu.stde.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EvaluationDTO {
    private UUID id;
    private UUID documentId;
    private String filename; // Helpful for frontend display
    
    private Integer completenessScore;
    private String completenessFeedback;
    
    private Integer clarityScore;
    private String clarityFeedback;
    
    private Integer consistencyScore;
    private String consistencyFeedback;
    
    private Integer verificationScore;
    private String verificationFeedback;
    
    private Integer overallScore;
    private String overallFeedback;
    
    private Instant createdAt;
}