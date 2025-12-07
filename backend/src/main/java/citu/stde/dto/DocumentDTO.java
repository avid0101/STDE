package citu.stde.dto;

import citu.stde.entity.DocumentStatus;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentDTO {
    
    private UUID id;
    private String filename;
    private String fileType;
    private Long fileSize;
    private Instant uploadDate;
    private DocumentStatus status;
    
    private String studentName;   // e.g., "Lada, Nathan"
    private Integer overallScore; // e.g., 85 (Nullable if pending)
    private UUID classroomId;     // Link back to class
    private String driveFileId;   // Google Drive File ID
}