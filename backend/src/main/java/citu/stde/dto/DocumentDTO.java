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
    
    private String studentName;
    private Integer overallScore;
    private UUID classroomId;
    private String driveFileId;
    private Boolean isSubmitted;
}