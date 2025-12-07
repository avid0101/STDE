package citu.stde.repository;

import citu.stde.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, UUID> {
    // Find class by the unique code (for students joining)
    Optional<Classroom> findByClassCode(String classCode);
    
    // Find all classes for a specific teacher
    List<Classroom> findByTeacherId(UUID teacherId);

    // Finds a classroom only if the ID and the Teacher ID match.
    Optional<Classroom> findByIdAndTeacherId(UUID id, UUID teacherId);

    // Find all classes a student is enrolled in
    List<Classroom> findByStudents_Id(UUID studentId);

    // Count classes for dashboard
    long countByTeacherId(UUID teacherId);
}