package citu.stde.dto;

import lombok.*;
import java.util.UUID;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClassroomDTO {
    private UUID id;
    private String name;
    private String section;
    private String classCode;
    private UUID teacherId;
    private String driveFolderId;
    private Instant createdAt;
    private int studentCount;
}