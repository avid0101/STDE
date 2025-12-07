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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @Column(nullable = false, length = 255)
    private String filename;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "drive_file_id", length = 255)
    private String driveFileId;

    @Column(name = "drive_webview_link", length = 500)
    private String driveWebViewLink;

    private String storagePath; 
    
    @Builder.Default
    private Boolean isCloudFile = false;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "is_submitted")
    @Builder.Default
    private Boolean isSubmitted = false;

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
        if (isSubmitted == null) {
            isSubmitted = false;
        }
    }
}