package com.axonrh.employee.repository;

import com.axonrh.employee.entity.DigitalHiringProcess;
import com.axonrh.employee.entity.enums.DigitalHiringStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DigitalHiringProcessRepository extends JpaRepository<DigitalHiringProcess, UUID> {

    Optional<DigitalHiringProcess> findByAccessToken(String accessToken);

    Optional<DigitalHiringProcess> findByTenantIdAndId(UUID tenantId, UUID id);

    Page<DigitalHiringProcess> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Page<DigitalHiringProcess> findByTenantIdAndStatus(UUID tenantId, DigitalHiringStatus status, Pageable pageable);

    Page<DigitalHiringProcess> findByTenantIdAndCandidateNameContainingIgnoreCase(
            UUID tenantId, String name, Pageable pageable);

    Page<DigitalHiringProcess> findByTenantIdAndStatusAndCandidateNameContainingIgnoreCase(
            UUID tenantId, DigitalHiringStatus status, String name, Pageable pageable);

    long countByTenantIdAndStatus(UUID tenantId, DigitalHiringStatus status);

    boolean existsByTenantIdAndCandidateEmailAndStatusNotIn(
            UUID tenantId, String email, List<DigitalHiringStatus> excludeStatuses);

    boolean existsByTenantIdAndCandidateIdAndStatusNotIn(
            UUID tenantId, UUID candidateId, List<DigitalHiringStatus> excludeStatuses);

    @Query("SELECT d FROM DigitalHiringProcess d LEFT JOIN FETCH d.documents " +
            "WHERE d.accessToken = :token")
    Optional<DigitalHiringProcess> findByAccessTokenWithDocuments(@Param("token") String token);

    @Query("SELECT d FROM DigitalHiringProcess d WHERE d.linkExpiresAt < :now " +
            "AND d.status = 'ADMISSION_PENDING'")
    List<DigitalHiringProcess> findExpiredLinks(@Param("now") LocalDateTime now);

    @Query("SELECT d.status, COUNT(d) FROM DigitalHiringProcess d " +
            "WHERE d.tenantId = :tenantId GROUP BY d.status")
    List<Object[]> countByStatusGrouped(@Param("tenantId") UUID tenantId);

    @Query("SELECT AVG(FUNCTION('EXTRACT', EPOCH FROM (d.completedAt - d.createdAt)) / 86400) " +
            "FROM DigitalHiringProcess d WHERE d.tenantId = :tenantId AND d.status = 'COMPLETED'")
    Double getAverageCompletionDays(@Param("tenantId") UUID tenantId);
}
