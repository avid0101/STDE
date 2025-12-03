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
    
    // Note: content is NOT included for security/performance
    // Content is too large to send in list responses
}