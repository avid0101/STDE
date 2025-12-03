package citu.stde.controller;

import citu.stde.dto.DocumentDTO;
import citu.stde.service.DocumentService;
import citu.stde.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            UUID userId = extractUserIdFromAuth(authentication);
            DocumentDTO document = documentService.uploadDocument(file, userId);

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

    private UUID extractUserIdFromAuth(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.getIdByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}