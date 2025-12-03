package citu.stde.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {
    
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 255)
    private String filename;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "upload_date", nullable = false)
    private Instant uploadDate;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    private DocumentStatus status;

    @PrePersist
    protected void onCreate() {
        if (uploadDate == null) {
            uploadDate = Instant.now();
        }
        if (status == null) {
            status = DocumentStatus.UPLOADED;
        }
    }
}