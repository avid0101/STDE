package citu.stde.controller;

import citu.stde.service.AuthService;
import citu.stde.entity.PasswordResetToken;
import citu.stde.entity.User;
import citu.stde.repository.PasswordResetTokenRepository;
import citu.stde.repository.UserRepository;
import citu.stde.service.EmailService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import lombok.RequiredArgsConstructor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.token.reset-password.expiration}")
    private int tokenExpirationMinutes;

    // Black Magic do not touch
    @GetMapping("/token")
    public Map<String, String> getGoogleToken(@RegisteredOAuth2AuthorizedClient("google") OAuth2AuthorizedClient client) {
        if (client == null) {
            throw new RuntimeException("No Google credentials found");
        }
        
        String accessToken = client.getAccessToken().getTokenValue();
        return Collections.singletonMap("token", accessToken);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        
        // 1. Validate User Exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with this email"));

        // 2. Cleanup: Delete any existing reset tokens for this user
        tokenRepository.findByUser(user).ifPresent(tokenRepository::delete);

        // 3. Create New Token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(Instant.now().plus(tokenExpirationMinutes, ChronoUnit.MINUTES))
                .build();
        
        tokenRepository.save(resetToken);

        // 4. Send Email
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);

        return ResponseEntity.ok(Map.of("message", "Password reset link sent to your email."));
    }

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("password");

        // 1. Find Token
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid password reset token"));

        // 2. Check Expiration
        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Token has expired");
        }

        // 3. Update User Password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordUpdatedAt(Instant.now());
        userRepository.save(user);

        // 4. Delete Used Token
        tokenRepository.delete(resetToken);

        return ResponseEntity.ok(Map.of("message", "Password successfully reset"));
    }

    // DTOs for requests (Kept exactly as they were)
    public static record RegisterRequest(
        String firstname,
        String lastname,
        String email,
        String password,
        String userType,  // optional: "STUDENT" or "TEACHER"
        String avatarUrl  // optional: can be null
    ) {}

    public static record LoginRequest(
        String email,
        String password
    ) {}
}