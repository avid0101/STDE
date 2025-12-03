package citu.stde.service;

import citu.stde.dto.DocumentDTO;
import citu.stde.entity.Document;
import citu.stde.entity.DocumentStatus;
import citu.stde.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;

    // Maximum file size: 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    // Allowed file types
    private static final List<String> ALLOWED_FILE_TYPES = List.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "text/plain"
    );

    public DocumentDTO uploadDocument(MultipartFile file, UUID userId) throws IOException {
        
        // Validate file is not empty
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 10MB");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_FILE_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Invalid file type. Only PDF, DOCX, and TXT files are allowed");
        }

        // Check for duplicate filename
        String filename = file.getOriginalFilename();
        if (documentRepository.existsByUserIdAndFilename(userId, filename)) {
            throw new IllegalArgumentException("A document with this filename already exists");
        }

        // Extract text content from file
        String content = extractTextFromFile(file);

        // Create document entity
        Document document = Document.builder()
                .userId(userId)
                .filename(filename)
                .fileType(contentType)
                .fileSize(file.getSize())
                .content(content)
                .uploadDate(Instant.now())
                .status(DocumentStatus.UPLOADED)
                .build();

        // Save to database
        Document savedDocument = documentRepository.save(document);

        // Convert to DTO and return
        return convertToDTO(savedDocument);
    }

    private String extractTextFromFile(MultipartFile file) throws IOException {
        String contentType = file.getContentType();

        if ("application/pdf".equals(contentType)) {
            return extractTextFromPDF(file);
        } else if ("application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType)) {
            return extractTextFromDOCX(file);
        } else if ("text/plain".equals(contentType)) {
            return new String(file.getBytes());
        }

        throw new IllegalArgumentException("Unsupported file type");
    }

    private String extractTextFromPDF(MultipartFile file) throws IOException {
        try (PDDocument document = PDDocument.load(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractTextFromDOCX(MultipartFile file) throws IOException {
        try (XWPFDocument document = new XWPFDocument(file.getInputStream());
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    public List<DocumentDTO> getUserDocuments(UUID userId) {
        return documentRepository.findByUserIdOrderByUploadDateDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DocumentDTO getDocumentById(UUID documentId, UUID userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        // Verify document belongs to user
        if (!document.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Access denied");
        }

        return convertToDTO(document);
    }

    public void deleteDocument(UUID documentId, UUID userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        // Verify document belongs to user
        if (!document.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Access denied");
        }

        documentRepository.delete(document);
    }

    private DocumentDTO convertToDTO(Document document) {
        return DocumentDTO.builder()
                .id(document.getId())
                .filename(document.getFilename())
                .fileType(document.getFileType())
                .fileSize(document.getFileSize())
                .uploadDate(document.getUploadDate())
                .status(document.getStatus())
                .build();
    }
}