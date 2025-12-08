package citu.stde.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "activity_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivityLog {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String action; // e.g., "LOGIN", "REGISTER", "UPLOAD", "EVALUATE"

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "user_email")
    private String userEmail;

    @Column(nullable = false)
    private Instant timestamp;
}