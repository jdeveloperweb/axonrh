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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    Optional<Enrollment> findByTenantIdAndId(UUID tenantId, UUID id);

    List<Enrollment> findByTenantIdAndEmployeeId(UUID tenantId, UUID employeeId);

    Page<Enrollment> findByTenantIdAndCourseId(UUID tenantId, UUID courseId, Pageable pageable);

    boolean existsByTenantIdAndCourseIdAndEmployeeId(UUID tenantId, UUID courseId, UUID employeeId);

    @Query("SELECT e FROM Enrollment e WHERE e.tenantId = :tenantId " +
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
}
