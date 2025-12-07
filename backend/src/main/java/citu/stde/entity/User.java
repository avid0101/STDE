package citu.stde.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.Instant;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 255)
    private String firstname;

    @Column(nullable = false, length = 255)
    private String lastname;

    @Column(nullable = false, length = 255, unique = true)
    private String email;

    @Column(length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false, length = 50)
    private UserType userType = UserType.STUDENT;

    @Column(name = "avatar_url", length = 500, nullable = true)
    private String avatarUrl;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "update_at")
    private Instant updatedAt;

    @Column(name = "password_updated_at")
    private Instant passwordUpdatedAt;
}