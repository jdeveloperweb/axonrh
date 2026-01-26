package com.axonrh.employee.repository;

import com.axonrh.employee.entity.AdmissionProcess;
import com.axonrh.employee.entity.enums.AdmissionStatus;
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
public interface AdmissionProcessRepository extends JpaRepository<AdmissionProcess, UUID> {

    Optional<AdmissionProcess> findByAccessToken(String accessToken);

    Optional<AdmissionProcess> findByTenantIdAndId(UUID tenantId, UUID id);

    Page<AdmissionProcess> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Page<AdmissionProcess> findByTenantIdAndStatus(UUID tenantId, AdmissionStatus status, Pageable pageable);

    List<AdmissionProcess> findByTenantIdAndStatusIn(UUID tenantId, List<AdmissionStatus> statuses);

    @Query("SELECT a FROM AdmissionProcess a WHERE a.tenantId = :tenantId " +
            "AND a.status NOT IN ('COMPLETED', 'CANCELLED', 'EXPIRED') " +
            "ORDER BY a.createdAt DESC")
    List<AdmissionProcess> findActiveProcesses(@Param("tenantId") UUID tenantId);

    @Query("SELECT a FROM AdmissionProcess a WHERE a.linkExpiresAt < :now " +
            "AND a.status = 'LINK_GENERATED'")
    List<AdmissionProcess> findExpiredLinks(@Param("now") LocalDateTime now);

    long countByTenantIdAndStatus(UUID tenantId, AdmissionStatus status);

    boolean existsByTenantIdAndCandidateEmailAndStatusNotIn(
            UUID tenantId, String email, List<AdmissionStatus> excludeStatuses);

    @Query("SELECT a FROM AdmissionProcess a LEFT JOIN FETCH a.documents " +
            "WHERE a.accessToken = :token")
    Optional<AdmissionProcess> findByAccessTokenWithDocuments(@Param("token") String token);

    // Additional methods for statistics and filtering
    Page<AdmissionProcess> findByTenantIdAndStatusAndCandidateNameContainingIgnoreCase(
            UUID tenantId, AdmissionStatus status, String name, Pageable pageable);

    Page<AdmissionProcess> findByTenantIdAndCandidateNameContainingIgnoreCase(
            UUID tenantId, String name, Pageable pageable);

    List<AdmissionProcess> findByTenantIdAndStatus(UUID tenantId, AdmissionStatus status);

    List<AdmissionProcess> findByStatus(AdmissionStatus status);

    long countByTenantIdAndCreatedAtBetween(UUID tenantId, LocalDateTime start, LocalDateTime end);

    long countByTenantIdAndStatusAndCreatedAtBetween(
            UUID tenantId, AdmissionStatus status, LocalDateTime start, LocalDateTime end);

    long countByTenantIdAndStatusNotInAndCreatedAtBetween(
            UUID tenantId, List<AdmissionStatus> excludeStatuses, LocalDateTime start, LocalDateTime end);
}
