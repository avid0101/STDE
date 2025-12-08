package citu.stde.controller;

import citu.stde.entity.Classroom;
import citu.stde.entity.User;
import citu.stde.repository.UserRepository;
import citu.stde.service.ClassroomService;
import citu.stde.repository.ClassroomRepository;
import citu.stde.dto.ClassroomDTO;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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

    @GetMapping("/teacher")
    public ResponseEntity<List<ClassroomDTO>> getTeacherClassrooms(Authentication authentication) {
        UUID teacherId = getUserId(authentication);
        List<Classroom> classrooms = classroomRepository.findByTeacherId(teacherId);
        
        List<ClassroomDTO> dtos = classrooms.stream()
            .map(c -> ClassroomDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .section(c.getSection())
                .classCode(c.getClassCode())
                .teacherId(c.getTeacherId())
                .driveFolderId(c.getDriveFolderId())
                .createdAt(c.getCreatedAt())
                .studentCount(c.getStudents() != null ? c.getStudents().size() : 0)
                .build())
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    // Pass driveFolderId to service
    @PostMapping
    public ResponseEntity<?> createClassroom(@RequestBody CreateClassRequest request, Authentication authentication) {
        try {
            UUID teacherId = getUserId(authentication);

            Classroom classroom = classroomService.createClassroom(
                    request.name(), 
                    request.section(), 
                    request.classCode(),
                    request.driveFolderId(), // New field
                    teacherId
            );

            return ResponseEntity.ok(classroom);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateClassroom(
            @PathVariable UUID id, 
            @RequestBody CreateClassRequest request, 
            Authentication authentication) {
        try {
            UUID teacherId = getUserId(authentication);
            
            Classroom updatedClassroom = classroomService.updateClassroom(
                id,
                request.name(),
                request.section(),
                request.classCode(),
                teacherId
            );
            
            return ResponseEntity.ok(updatedClassroom);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClassroom(@PathVariable UUID id, Authentication authentication) {
        try {
            UUID teacherId = getUserId(authentication);
            classroomService.deleteClassroom(id, teacherId);
            return ResponseEntity.ok(Map.of("message", "Classroom deleted successfully"));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinClassroom(@RequestBody Map<String, String> payload, Authentication authentication) {
        try {
            String classCode = payload.get("classCode");
            UUID studentId = getUserId(authentication);
            
            Classroom joinedClass = classroomService.joinClassroom(classCode, studentId);
            return ResponseEntity.ok(joinedClass);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to join class"));
        }
    }

    @GetMapping("/student")
    public ResponseEntity<List<Classroom>> getStudentClassrooms(Authentication authentication) {
        UUID studentId = getUserId(authentication);
        return ResponseEntity.ok(classroomService.getStudentClassrooms(studentId));
    }

    @GetMapping("/{classId}/students")
    public ResponseEntity<?> getClassStudents(@PathVariable UUID classId, Authentication authentication) {
        try {
            UUID userId = getUserId(authentication);
            classroomService.verifyClassroomOwnership(classId, userId);
            Set<User> students = classroomService.getClassroomStudents(classId);
            
            List<Map<String, Object>> studentList = students.stream().map(s -> Map.of(
                "id", (Object) s.getId(),
                "name", s.getFirstname() + " " + s.getLastname(),
                "email", s.getEmail(),
                "avatarUrl", s.getAvatarUrl() != null ? s.getAvatarUrl() : ""
            )).collect(Collectors.toList());

            return ResponseEntity.ok(studentList);

        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.getIdByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Add driveFolderId to DTO
    public record CreateClassRequest(String name, String section, String classCode, String driveFolderId) {}
}