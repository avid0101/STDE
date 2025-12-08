package citu.stde.controller;

import citu.stde.dto.DocumentDTO;
import citu.stde.entity.Classroom;
import citu.stde.entity.Document;
import citu.stde.repository.ClassroomRepository;
import citu.stde.repository.DocumentRepository;
import citu.stde.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ClassroomRepository classroomRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    @GetMapping("/teacher")
        public ResponseEntity<?> getTeacherStats(Authentication authentication) {
            UUID teacherId = getUserId(authentication);

            // 1. Counts
            long totalClasses = classroomRepository.countByTeacherId(teacherId);
            long totalSubmissions = documentRepository.countByClassroom_TeacherIdAndIsSubmittedTrue(teacherId);
            
            // Use the new query method
            long totalStudents = classroomRepository.countUniqueStudentsByTeacherId(teacherId);

            // 2. Recent Activity (Latest 10)
            List<Document> recentDocs = documentRepository.findByClassroom_TeacherIdAndIsSubmittedTrueOrderByUploadDateDesc(
                    teacherId, PageRequest.of(0, 10));

            List<DocumentDTO> recentActivity = recentDocs.stream().map(doc -> 
                DocumentDTO.builder()
                    .id(doc.getId())
                    .filename(doc.getFilename())
                    .studentName(doc.getUser().getFirstname() + " " + doc.getUser().getLastname())
                    .uploadDate(doc.getUploadDate())
                    .overallScore(null) 
                    .status(doc.getStatus())
                    .classroomId(doc.getClassroom().getId())
                    .driveFileId(doc.getDriveFileId())
                    .build()
            ).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "totalClasses", totalClasses,
                "totalStudents", totalStudents,
                "totalSubmissions", totalSubmissions,
                "recentActivity", recentActivity
            ));
        }

    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.getIdByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}