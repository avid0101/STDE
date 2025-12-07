package citu.stde.service;

import citu.stde.entity.Classroom;
import citu.stde.repository.ClassroomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final GoogleDriveService googleDriveService;

    @Transactional
    public Classroom createClassroom(String name, String section, String classCode, UUID teacherId) {
        // 1. Check if class code already exists (Validation)
        if (classroomRepository.findByClassCode(classCode).isPresent()) {
            throw new IllegalArgumentException("Class code '" + classCode + "' is already taken.");
        }

        try {
            // 2. Create the physical folder in Google Drive
            String folderName = name + " - " + section;
            String folderId = googleDriveService.createFolder(folderName, null);

            // 3. Save to Database with the MANUAL Class Code
            Classroom classroom = Classroom.builder()
                    .name(name)
                    .section(section)
                    .teacherId(teacherId)
                    .classCode(classCode) // <--- Use the teacher's code
                    .driveFolderId(folderId)
                    .build();

            return classroomRepository.save(classroom);

        } catch (IOException e) {
            throw new RuntimeException("Failed to create Google Drive folder: " + e.getMessage());
        }
    }
}