package citu.stde.controller;

import citu.stde.entity.User;
import citu.stde.repository.UserRepository;
import citu.stde.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request, Authentication authentication) {
        try {
            UUID userId = getUserId(authentication);
            User updatedUser = userService.updateUserProfile(userId, request.firstname(), request.lastname());
            
            // Return the updated user object structure matching login response
            return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully",
                "user", Map.of(
                    "id", updatedUser.getId().toString(),
                    "firstname", updatedUser.getFirstname(),
                    "lastname", updatedUser.getLastname(),
                    "email", updatedUser.getEmail(),
                    "userType", updatedUser.getUserType().name(),
                    "avatarUrl", updatedUser.getAvatarUrl() != null ? updatedUser.getAvatarUrl() : ""
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.getIdByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public record UpdateProfileRequest(String firstname, String lastname) {}
}