package citu.stde.service;

import citu.stde.entity.Classroom;
import citu.stde.entity.Document;
import citu.stde.entity.User;
import citu.stde.repository.ClassroomRepository;
import citu.stde.repository.DocumentRepository;
import citu.stde.repository.EvaluationRepository;
import citu.stde.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final GoogleDriveService googleDriveService;
    private final UserRepository userRepository;
    
    private final DocumentRepository documentRepository;
    private final EvaluationRepository evaluationRepository;

    public void verifyClassroomOwnership(UUID classId, UUID teacherId) {
        classroomRepository.findByIdAndTeacherId(classId, teacherId)
            .orElseThrow(() -> new SecurityException("Unauthorized: User does not own this classroom or it does not exist."));
    }

    public boolean isStudentEnrolled(UUID classId, UUID studentId) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found"));
        
        return classroom.getStudents().stream()
                .anyMatch(student -> student.getId().equals(studentId));
    }

    // Accept existingFolderId (Optional)
    @Transactional
    public Classroom createClassroom(String name, String section, String classCode, String existingFolderId, UUID teacherId) {
        if (classroomRepository.findByClassCode(classCode).isPresent()) {
            throw new IllegalArgumentException("Class code '" + classCode + "' is already taken.");
        }

        try {
            String folderId;
            
            // Logic: Use existing ID if provided, otherwise create new folder
            if (existingFolderId != null && !existingFolderId.trim().isEmpty()) {
                folderId = existingFolderId.trim();
                // (Optional: You could add a check here to verify the folder exists using googleDriveService)
            } else {
                String folderName = name + " - " + section;
                folderId = googleDriveService.createFolder(folderName, null);
            }

            Classroom classroom = Classroom.builder()
                    .name(name)
                    .section(section)
                    .teacherId(teacherId)
                    .classCode(classCode)
                    .driveFolderId(folderId)
                    .build();

            return classroomRepository.save(classroom);

        } catch (IOException e) {
            throw new RuntimeException("Failed to create/link Google Drive folder: " + e.getMessage());
        }
    }

    @Transactional
    public Classroom updateClassroom(UUID classId, String name, String section, String classCode, UUID teacherId) {
        Classroom classroom = classroomRepository.findByIdAndTeacherId(classId, teacherId)
                .orElseThrow(() -> new SecurityException("Unauthorized: User does not own this classroom."));

        if (!classroom.getClassCode().equals(classCode) && classroomRepository.findByClassCode(classCode).isPresent()) {
            throw new IllegalArgumentException("Class code '" + classCode + "' is already taken.");
        }

        classroom.setName(name);
        classroom.setSection(section);
        classroom.setClassCode(classCode);

        return classroomRepository.save(classroom);
    }

    @Transactional
    public void deleteClassroom(UUID classId, UUID teacherId) {
        Classroom classroom = classroomRepository.findByIdAndTeacherId(classId, teacherId)
                .orElseThrow(() -> new SecurityException("Unauthorized: User does not own this classroom."));

        // 1. Delete Folder from Google Drive
        if (classroom.getDriveFolderId() != null) {
            try {
                googleDriveService.deleteFile(classroom.getDriveFolderId());
            } catch (IOException e) {
                System.err.println("Warning: Failed to delete Drive folder: " + e.getMessage());
            }
        }

        // 2. Cascade Delete: Documents & Evaluations
        List<Document> documents = documentRepository.findByClassroomIdOrderByUploadDateDesc(classId);
        
        for (Document doc : documents) {
            if (evaluationRepository.findByDocumentId(doc.getId()).isPresent()) {
                evaluationRepository.deleteByDocumentId(doc.getId());
            }
            documentRepository.delete(doc);
        }

        // 3. Delete Classroom
        classroomRepository.delete(classroom);
    }

    @Transactional
    public Classroom joinClassroom(String classCode, UUID studentId) {
        Classroom classroom = classroomRepository.findByClassCode(classCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid class code."));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        if (classroom.getStudents().contains(student)) {
            throw new IllegalArgumentException("You are already enrolled in this class.");
        }

        classroom.getStudents().add(student);
        return classroomRepository.save(classroom);
    }

    @Transactional(readOnly = true)
    public List<Classroom> getStudentClassrooms(UUID studentId) {
        return classroomRepository.findByStudents_Id(studentId);
    }

    @Transactional(readOnly = true)
    public Set<User> getClassroomStudents(UUID classId) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found"));
        classroom.getStudents().size(); 
        return classroom.getStudents();
    }
}