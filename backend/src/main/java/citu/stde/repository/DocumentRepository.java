package citu.stde.repository;

import citu.stde.entity.Document;
import citu.stde.entity.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    
    // Find all documents by user ID
    List<Document> findByUserId(UUID userId);
    
    // Find documents by user ID, ordered by upload date (newest first)
    List<Document> findByUserIdOrderByUploadDateDesc(UUID userId);
    
    // Find documents by user ID and status
    List<Document> findByUserIdAndStatus(UUID userId, DocumentStatus status);
    
    // Count documents by user ID
    long countByUserId(UUID userId);
    
    // Check if document exists by user ID and filename
    boolean existsByUserIdAndFilename(UUID userId, String filename);
}