package citu.stde.repository;

import citu.stde.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, UUID> {
    List<Evaluation> findByUserId(UUID userId);
    
    Optional<Evaluation> findByDocumentId(UUID documentId);

    void deleteByDocumentId(UUID documentId);

    Optional<Evaluation> findTopByUserIdAndDocument_ContentHashOrderByCreatedAtDesc(UUID userId, String contentHash);
}