package citu.stde.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.Instant;

@Entity
@Table(name = "classrooms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Classroom {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String section;

    @Column(nullable = false, unique = true)
    private String classCode;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "drive_folder_id")
    private String driveFolderId;
    
    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}