package citu.stde.repository;

import citu.stde.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    // Get latest logs first
    List<ActivityLog> findAllByOrderByTimestampDesc();
}