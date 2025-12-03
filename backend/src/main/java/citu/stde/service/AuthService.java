package citu.stde.service;

import citu.stde.controller.AuthController.RegisterRequest;
import citu.stde.controller.AuthController.LoginRequest;
import citu.stde.entity.User;
import citu.stde.entity.UserType;
import citu.stde.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ResponseEntity<?> register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            return ResponseEntity.badRequest().body("Email already in use");
        }
        UserType type = UserType.STUDENT;
        if (req.userType() != null && req.userType().equalsIgnoreCase("TEACHER")) {
            type = UserType.TEACHER;
        }
        User user = User.builder()
            .firstname(req.firstname())
            .lastname(req.lastname())
            .email(req.email())
            .password(passwordEncoder.encode(req.password()))
            .userType(type)
            .isActive(true)
            .avatarUrl(req.avatarUrl())
            .build();
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    public ResponseEntity<?> login(LoginRequest req) {
        Optional<User> userOpt = userRepository.findByEmail(req.email());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid credentials");
        }
        User user = userOpt.get();
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Invalid credentials");
        }
        // Placeholder for JWT generation
        String token = "dummy-jwt-token"; // Replace with JwtUtil.generateToken(user)
        return ResponseEntity.ok(new AuthResponse(token, user.getFirstname(), user.getUserType().name()));
    }

    public static record AuthResponse(String token, String firstname, String userType) {}
}
