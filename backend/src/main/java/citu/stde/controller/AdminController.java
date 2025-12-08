package citu.stde.controller;

import citu.stde.entity.User;
import citu.stde.service.AdminService;
import citu.stde.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable java.util.UUID userId, @RequestBody Map<String, Object> updates) {
        String type = (String) updates.get("userType");
        Boolean active = (Boolean) updates.get("isActive");
        return ResponseEntity.ok(userService.updateUserRoleAndStatus(userId, type, active));
    }

    @GetMapping("/logs")
    public ResponseEntity<?> getLogs() {
        return ResponseEntity.ok(adminService.getAllLogs());
    }

    @GetMapping("/health")
    public ResponseEntity<?> getHealth() {
        return ResponseEntity.ok(adminService.getSystemHealth());
    }
}