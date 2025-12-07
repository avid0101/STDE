package citu.stde.service;

import citu.stde.dto.DocumentDTO;
import citu.stde.entity.Classroom;
import citu.stde.entity.Document;
import citu.stde.entity.DocumentStatus;
import citu.stde.entity.User;
import citu.stde.entity.Evaluation; 
import citu.stde.repository.ClassroomRepository;
import citu.stde.repository.DocumentRepository;
import citu.stde.repository.EvaluationRepository; 
import citu.stde.repository.UserRepository;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final GoogleDriveService googleDriveService;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final EvaluationRepository evaluationRepository; 
    private final OAuth2AuthorizedClientService clientService; 

    // Maximum file size: 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private static final List<String> ALLOWED_FILE_TYPES = List.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
            "text/plain"
    );

    // Get all documents for a specific class
    @Transactional(readOnly = true)
    public List<DocumentDTO> getDocumentsByClass(UUID classroomId) {
        return documentRepository.findByClassroomIdOrderByUploadDateDesc(classroomId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DocumentDTO uploadDocument(MultipartFile file, UUID userId, UUID classId) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String destinationFolderId = null;
        Classroom classroom = null; // Hold reference to set relationship

        if (classId != null) {
            classroom = classroomRepository.findById(classId)
                    .orElseThrow(() -> new IllegalArgumentException("Classroom not found"));
            destinationFolderId = classroom.getDriveFolderId(); 
        }

        File driveFile = googleDriveService.uploadFile(file, destinationFolderId);

        Document document = Document.builder()
                .user(user)
                .classroom(classroom) 
                .filename(file.getOriginalFilename())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .driveFileId(driveFile.getId())
                .driveWebViewLink(driveFile.getWebViewLink())
                .uploadDate(Instant.now())
                .status(DocumentStatus.UPLOADED)
                .isCloudFile(false)
                .build();

        Document savedDocument = documentRepository.save(document);
        return convertToDTO(savedDocument);
    }

    public List<DocumentDTO> getUserDocuments(UUID userId) {
        return documentRepository.findByUserIdOrderByUploadDateDesc(userId)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public DocumentDTO getDocumentById(UUID documentId, UUID userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        if (!document.getUser().getId().equals(userId)) throw new IllegalArgumentException("Access denied");
        return convertToDTO(document);
    }

    public void deleteDocument(UUID documentId, UUID userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        if (!document.getUser().getId().equals(userId)) throw new IllegalArgumentException("Access denied");
        
        try {
            if (document.getDriveFileId() != null) {
                googleDriveService.deleteFile(document.getDriveFileId());
            }
        } catch (IOException e) {
            System.err.println("Warning: Failed to delete file from Drive: " + e.getMessage());
        }
        documentRepository.delete(document);
    }

    public Document copyFromGoogleDrive(String originalFileId, String classIdRaw, UUID userId) throws IOException {
        Drive userDriveService = buildDriveClientForCurrentUser();

        String targetFolderId = "root"; 
        Classroom classroom = null;

        if (classIdRaw != null && !classIdRaw.isEmpty()) {
            try {
                UUID classId = UUID.fromString(classIdRaw);
                classroom = classroomRepository.findById(classId).orElse(null);
                if (classroom != null) {
                    targetFolderId = classroom.getDriveFolderId();
                }
            } catch (IllegalArgumentException e) { }
        }

        File copyMetadata = new File();
        copyMetadata.setParents(Collections.singletonList(targetFolderId));

        File copiedFile = userDriveService.files().copy(originalFileId, copyMetadata)
                .setFields("id, name, webViewLink, size, mimeType")
                .execute();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Document doc = new Document();
        doc.setFilename(copiedFile.getName());
        doc.setFileType(copiedFile.getMimeType());
        doc.setFileSize(copiedFile.getSize()); 
        doc.setStoragePath(copiedFile.getId()); 
        doc.setDriveFileId(copiedFile.getId()); 
        doc.setDriveWebViewLink(copiedFile.getWebViewLink());
        doc.setUploadDate(Instant.now());
        doc.setUser(user);
        doc.setClassroom(classroom); 
        doc.setStatus(DocumentStatus.UPLOADED);
        doc.setIsCloudFile(true); 

        return documentRepository.save(doc);
    }

    private Drive buildDriveClientForCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) throw new RuntimeException("No user logged in");

        OAuth2AuthorizedClient client = clientService.loadAuthorizedClient("google", authentication.getName());
        if (client == null) throw new RuntimeException("User has not authorized Google Drive access");

        String accessToken = client.getAccessToken().getTokenValue();
        GoogleCredential credential = new GoogleCredential().setAccessToken(accessToken);

        try {
            return new Drive.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(), 
                    GsonFactory.getDefaultInstance(), 
                    credential)
                    .setApplicationName("STDE")
                    .build();
        } catch (GeneralSecurityException | IOException e) {
            throw new RuntimeException("Failed to initialize Google Drive client", e);
        }
    }

    private DocumentDTO convertToDTO(Document document) {
        
        // 1. Get Student Name safely
        String studentName = "Unknown";
        if (document.getUser() != null) {
            studentName = document.getUser().getFirstname() + " " + document.getUser().getLastname();
        }

        // 2. Get Score (if evaluated)
        Integer score = null;
        if (document.getStatus() == DocumentStatus.COMPLETED) {
            Optional<Evaluation> eval = evaluationRepository.findByDocumentId(document.getId());
            if (eval.isPresent()) {
                score = eval.get().getOverallScore();
            }
        }

        return DocumentDTO.builder()
                .id(document.getId())
                .filename(document.getFilename())
                .fileType(document.getFileType())
                .fileSize(document.getFileSize())
                .uploadDate(document.getUploadDate())
                .status(document.getStatus())
                .studentName(studentName) 
                .overallScore(score)      
                .driveFileId(document.getDriveFileId())
                .classroomId(document.getClassroom() != null ? document.getClassroom().getId() : null)
                .build();
    }
}