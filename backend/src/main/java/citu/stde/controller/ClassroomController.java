package citu.stde.controller;

import citu.stde.entity.Classroom;
import citu.stde.repository.UserRepository;
import citu.stde.service.ClassroomService;
import citu.stde.repository.ClassroomRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;
    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;

    @GetMapping
    public ResponseEntity<List<Classroom>> getAllClassrooms() {
        return ResponseEntity.ok(classroomRepository.findAll());
    }

    // Get classes for the specific logged-in teacher
    @GetMapping("/teacher")
    public ResponseEntity<List<Classroom>> getTeacherClassrooms(Authentication authentication) {
        String email = authentication.getName();
        UUID teacherId = userRepository.getIdByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(classroomRepository.findByTeacherId(teacherId));
    }

    @PostMapping
    public ResponseEntity<?> createClassroom(@RequestBody CreateClassRequest request, Authentication authentication) {
        try {
            // Get the teacher's ID from the logged-in user
            String email = authentication.getName();
            UUID teacherId = userRepository.getIdByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Classroom classroom = classroomService.createClassroom(
                    request.name(), 
                    request.section(), 
                    request.classCode(),
                    teacherId
            );

            return ResponseEntity.ok(classroom);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // DTO for the request
    public record CreateClassRequest(String name, String section, String classCode) {}
}