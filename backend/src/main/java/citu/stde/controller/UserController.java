package citu.stde.controller;

import citu.stde.entity.User;
import citu.stde.repository.UserRepository;
import citu.stde.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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

    // ADMIN ENDPOINT - Get All Users (for Admin Dashboard)
    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers(Authentication authentication) {
        // In a real application, the security config (SecurityConfig.java) would enforce 
        // that only users with the 'ADMIN' role can access this endpoint.
        
        List<User> users = userService.getAllUsers();
        
        List<Map<String, Object>> userList = users.stream().map(u -> Map.of(
            "id", (Object) u.getId(),
            "firstname", u.getFirstname(),
            "lastname", u.getLastname(),
            "email", u.getEmail(),
            "userType", u.getUserType().name(),
            "isActive", u.getIsActive()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(userList);
    }
    
    // ADMIN ENDPOINT - Update User Role and Status
    @PatchMapping("/{userId}")
    public ResponseEntity<?> updateRoleAndStatus(
        @PathVariable UUID userId, 
        @RequestBody AdminUserUpdateRequest request, 
        Authentication authentication) {
        
        // In a real application, the security config would enforce 'ADMIN' role here.

        try {
            User updatedUser = userService.updateUserRoleAndStatus(
                userId, 
                request.userType(), 
                request.isActive()
            );

            return ResponseEntity.ok(Map.of(
                "message", "User updated successfully",
                "user", Map.of(
                    "id", updatedUser.getId().toString(),
                    "firstname", updatedUser.getFirstname(),
                    "lastname", updatedUser.getLastname(),
                    "email", updatedUser.getEmail(),
                    "userType", updatedUser.getUserType().name(),
                    "isActive", updatedUser.getIsActive()
                )
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update user: " + e.getMessage()));
        }
    }

    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.getIdByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public record UpdateProfileRequest(String firstname, String lastname) {}
    
    public record AdminUserUpdateRequest(String userType, Boolean isActive) {}
}