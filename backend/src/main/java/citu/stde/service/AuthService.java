package citu.stde.service;

import citu.stde.controller.AuthController.RegisterRequest;
import citu.stde.controller.AuthController.LoginRequest;
import citu.stde.entity.User;
import citu.stde.entity.UserType;
import citu.stde.repository.UserRepository;
import citu.stde.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public ResponseEntity<?> register(RegisterRequest req) {
        // Check if email already exists
        if (userRepository.existsByEmail(req.email())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
        }

        // Determine user type
        UserType type = UserType.STUDENT;
        if (req.userType() != null && req.userType().equalsIgnoreCase("TEACHER")) {
            type = UserType.TEACHER;
        }

        // Create new user
        User user = User.builder()
            .firstname(req.firstname())
            .lastname(req.lastname())
            .email(req.email())
            .password(passwordEncoder.encode(req.password()))
            .userType(type)
            .isActive(true)
            .avatarUrl(req.avatarUrl())
            .createdAt(Instant.now())
            .build();

        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "message", "User registered successfully",
            "email", user.getEmail()
        ));
    }

    public ResponseEntity<?> login(LoginRequest req) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password())
            );

            // Find user
            Optional<User> userOpt = userRepository.findByEmail(req.email());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
            }

            User user = userOpt.get();

            // Check if account is active
            if (!user.getIsActive()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Account is deactivated"));
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getId().toString(),
                user.getUserType().name()
            );

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", Map.of(
                "id", user.getId().toString(),
                "firstname", user.getFirstname(),
                "lastname", user.getLastname(),
                "email", user.getEmail(),
                "userType", user.getUserType().name(),
                "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
            ));

            return ResponseEntity.ok(response);

        } catch (AuthenticationException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid email or password"));
        }
    }
}