package citu.stde.controller;

import citu.stde.service.AuthService;

import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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