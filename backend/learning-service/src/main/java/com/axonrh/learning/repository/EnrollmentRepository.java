package com.axonrh.learning.repository;

import com.axonrh.learning.entity.Enrollment;
import com.axonrh.learning.entity.enums.EnrollmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Enrollment e WHERE e.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") UUID courseId);

    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course WHERE e.tenantId = :tenantId AND e.id = :id")
    Optional<Enrollment> findByTenantIdAndId(@Param("tenantId") UUID tenantId, @Param("id") UUID id);
    
    Page<Enrollment> findByTenantId(UUID tenantId, Pageable pageable);

    @Query("SELECT e FROM Enrollment e WHERE e.tenantId = :tenantId AND e.employeeId = :employeeId")
    List<Enrollment> findByTenantIdAndEmployeeId(@Param("tenantId") UUID tenantId, @Param("employeeId") UUID employeeId);

    Page<Enrollment> findByTenantIdAndCourseId(UUID tenantId, UUID courseId, Pageable pageable);

    boolean existsByCourseId(UUID courseId);

    boolean existsByTenantIdAndCourseIdAndEmployeeId(UUID tenantId, UUID courseId, UUID employeeId);

    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course WHERE e.tenantId = :tenantId AND e.course.id = :courseId AND e.employeeId = :employeeId")
    Optional<Enrollment> findByTenantIdAndCourseIdAndEmployeeId(@Param("tenantId") UUID tenantId, @Param("courseId") UUID courseId, @Param("employeeId") UUID employeeId);

    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course WHERE e.tenantId = :tenantId " +
           "AND e.employeeId = :employeeId " +
           "AND e.status IN ('ENROLLED', 'IN_PROGRESS')")
    List<Enrollment> findActiveByEmployee(@Param("tenantId") UUID tenantId,
                                          @Param("employeeId") UUID employeeId);

    @Query("SELECT e FROM Enrollment e WHERE e.tenantId = :tenantId " +
           "AND e.dueDate < :date " +
           "AND e.status NOT IN ('COMPLETED', 'CANCELLED', 'EXPIRED')")
    List<Enrollment> findOverdue(@Param("tenantId") UUID tenantId, @Param("date") LocalDate date);

    long countByTenantIdAndEmployeeId(UUID tenantId, UUID employeeId);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.tenantId = :tenantId " +
           "AND e.employeeId = :employeeId AND e.status = :status")
    long countByEmployeeAndStatus(@Param("tenantId") UUID tenantId,
                                  @Param("employeeId") UUID employeeId,
                                  @Param("status") EnrollmentStatus status);

    @Query("SELECT AVG(e.progressPercentage) FROM Enrollment e WHERE e.tenantId = :tenantId " +
           "AND e.employeeId = :employeeId " +
           "AND e.status IN ('ENROLLED', 'IN_PROGRESS')")
    Double calculateAverageProgress(@Param("tenantId") UUID tenantId,
                                    @Param("employeeId") UUID employeeId);

    // Dashboard Queries

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.tenantId = :tenantId AND e.status IN ('ENROLLED', 'IN_PROGRESS')")
    long countActiveByTenant(@Param("tenantId") UUID tenantId);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.tenantId = :tenantId " +
           "AND e.status = 'COMPLETED' " +
           "AND e.completedAt BETWEEN :start AND :end")
    long countCompletedByTenantAndDateRange(@Param("tenantId") UUID tenantId,
                                            @Param("start") LocalDateTime start,
                                            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.tenantId = :tenantId " +
            "AND e.enrolledAt BETWEEN :start AND :end")
    long countEnrolledByTenantAndDateRange(@Param("tenantId") UUID tenantId,
                                            @Param("start") LocalDateTime start,
                                            @Param("end") LocalDateTime end);


    @Query("SELECT AVG(e.progressPercentage) FROM Enrollment e WHERE e.tenantId = :tenantId " +
           "AND e.status IN ('ENROLLED', 'IN_PROGRESS')")
    Double calculateTenantAverageProgress(@Param("tenantId") UUID tenantId);

    @Query("SELECT SUM(c.durationMinutes) FROM Enrollment e JOIN e.course c WHERE e.tenantId = :tenantId " +
           "AND e.status = 'COMPLETED'")
    Long sumCompletedDurationMinutes(@Param("tenantId") UUID tenantId);

    @Query("SELECT e.status, COUNT(e) FROM Enrollment e WHERE e.tenantId = :tenantId GROUP BY e.status")
    List<Object[]> countByStatusGrouped(@Param("tenantId") UUID tenantId);
}
