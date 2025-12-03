package citu.stde.controller;

import citu.stde.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // DTOs for requests
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
