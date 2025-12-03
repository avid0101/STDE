package citu.stde.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evaluations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Evaluation {

    @Id
    @GeneratedValue
    private UUID id;

    // One Document has One Evaluation
    @OneToOne
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    // 1. Completeness
    @Column(name = "completeness_score")
    private Integer completenessScore;
    
    @Column(name = "completeness_feedback", columnDefinition = "TEXT")
    private String completenessFeedback;

    // 2. Clarity
    @Column(name = "clarity_score")
    private Integer clarityScore;
    
    @Column(name = "clarity_feedback", columnDefinition = "TEXT")
    private String clarityFeedback;

    // 3. Consistency
    @Column(name = "consistency_score")
    private Integer consistencyScore;
    
    @Column(name = "consistency_feedback", columnDefinition = "TEXT")
    private String consistencyFeedback;

    // 4. Verification Coverage
    @Column(name = "verification_score")
    private Integer verificationScore;
    
    @Column(name = "verification_feedback", columnDefinition = "TEXT")
    private String verificationFeedback;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Column(name = "overall_feedback", columnDefinition = "TEXT")
    private String overallFeedback;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}