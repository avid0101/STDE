package citu.stde.controller;

import citu.stde.dto.DocumentDTO;
import citu.stde.service.DocumentService;
import citu.stde.service.ClassroomService; 
import citu.stde.repository.UserRepository;
import citu.stde.entity.Document;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;
    private final ClassroomService classroomService; 

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "classId", required = false) UUID classId,
            Authentication authentication) {
        try {
            UUID userId = extractUserIdFromAuth(authentication);
            
            DocumentDTO document = documentService.uploadDocument(file, userId, classId);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Document uploaded successfully",
                    "document", document
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to upload document: " + e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserDocuments(Authentication authentication) {
        try {
            UUID userId = extractUserIdFromAuth(authentication);
            List<DocumentDTO> documents = documentService.getUserDocuments(userId);

            return ResponseEntity.ok(Map.of(
                    "documents", documents,
                    "count", documents.size()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to fetch documents: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<?> getDocument(
            @PathVariable UUID documentId,
            Authentication authentication) {
        try {
            UUID userId = extractUserIdFromAuth(authentication);
            DocumentDTO document = documentService.getDocumentById(documentId, userId);

            return ResponseEntity.ok(document);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to fetch document: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable UUID documentId,
            Authentication authentication) {
        try {
            UUID userId = extractUserIdFromAuth(authentication);
            documentService.deleteDocument(documentId, userId);

            return ResponseEntity.ok(Map.of(
                    "message", "Document deleted successfully"
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to delete document: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/upload-drive")
    public ResponseEntity<?> uploadFromDrive(@RequestBody DriveUploadRequest request, Authentication authentication) {
        try {
            // 1. Get the current user
            UUID userId = extractUserIdFromAuth(authentication);

            // 2. Call the service to perform the copy
            Document savedDoc = documentService.copyFromGoogleDrive(
                request.fileId(), 
                request.classId(), 
                userId
            );

            return ResponseEntity.ok(savedDoc);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Drive import failed: " + e.getMessage()));
        }
    }

    //ENDPOINT WITH SECURITY CHECK
    @GetMapping("/classroom/{classId}")
    public ResponseEntity<?> getClassDocuments(
            @PathVariable UUID classId,
            Authentication authentication) {
        try {
            // 1. Get the current user's ID (Teacher/Professor)
            UUID userId = extractUserIdFromAuth(authentication);

            // 2. Horizontal Access Control: Verify the user owns this class
            classroomService.verifyClassroomOwnership(classId, userId);

            // 3. If check passes, fetch the data
            List<DocumentDTO> documents = documentService.getDocumentsByClass(classId);

            return ResponseEntity.ok(documents);

        } catch (SecurityException e) {
            // Return 403 Forbidden if user doesn't own the class
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to fetch class documents: " + e.getMessage()
            ));
        }
    }

    private UUID extractUserIdFromAuth(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.getIdByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public record DriveUploadRequest(String fileId, String classId) {}
}