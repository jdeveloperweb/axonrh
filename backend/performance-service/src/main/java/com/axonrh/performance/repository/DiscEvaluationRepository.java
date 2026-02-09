package com.axonrh.performance.repository;

import com.axonrh.performance.entity.DiscEvaluation;
import com.axonrh.performance.entity.enums.DiscAssessmentStatus;
import com.axonrh.performance.entity.enums.DiscProfileType;
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
public interface DiscEvaluationRepository extends JpaRepository<DiscEvaluation, UUID> {

    Optional<DiscEvaluation> findByTenantIdAndId(UUID tenantId, UUID id);

    // Ultimo resultado do colaborador
    Optional<DiscEvaluation> findFirstByTenantIdAndEmployeeIdAndStatusOrderByCompletedAtDesc(
        UUID tenantId, UUID employeeId, DiscAssessmentStatus status);

    // Todos os resultados do colaborador
    List<DiscEvaluation> findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(UUID tenantId, UUID employeeId);

    // Resultados completados do colaborador
    List<DiscEvaluation> findByTenantIdAndEmployeeIdAndStatusOrderByCompletedAtDesc(
        UUID tenantId, UUID employeeId, DiscAssessmentStatus status);

    // Avaliacoes pendentes para um colaborador
    Optional<DiscEvaluation> findFirstByTenantIdAndEmployeeIdAndStatusIn(
        UUID tenantId, UUID employeeId, List<DiscAssessmentStatus> statuses);

    // Listagem paginada
    Page<DiscEvaluation> findByTenantId(UUID tenantId, Pageable pageable);

    Page<DiscEvaluation> findByTenantIdAndStatus(UUID tenantId, DiscAssessmentStatus status, Pageable pageable);

    // Estatisticas
    long countByTenantIdAndStatus(UUID tenantId, DiscAssessmentStatus status);

    @Query("SELECT COUNT(e) FROM DiscEvaluation e WHERE e.tenantId = :tenantId " +
           "AND e.dueDate < :date AND e.status IN ('PENDING', 'IN_PROGRESS')")
    long countOverdue(@Param("tenantId") UUID tenantId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(e) FROM DiscEvaluation e WHERE e.tenantId = :tenantId " +
           "AND e.status = 'COMPLETED' AND e.primaryProfile = :profileType")
    long countByPrimaryProfile(@Param("tenantId") UUID tenantId, @Param("profileType") DiscProfileType profileType);

    // Avaliacoes atrasadas
    @Query("SELECT e FROM DiscEvaluation e WHERE e.tenantId = :tenantId " +
           "AND e.dueDate < :date AND e.status IN ('PENDING', 'IN_PROGRESS')")
    List<DiscEvaluation> findOverdue(@Param("tenantId") UUID tenantId, @Param("date") LocalDate date);

    // Avaliacoes por departamento (requer join com employee-service)
    @Query("SELECT e FROM DiscEvaluation e WHERE e.tenantId = :tenantId " +
           "AND e.employeeId IN :employeeIds AND e.status = 'COMPLETED' " +
           "ORDER BY e.completedAt DESC")
    List<DiscEvaluation> findCompletedByEmployeeIds(@Param("tenantId") UUID tenantId,
                                                    @Param("employeeIds") List<UUID> employeeIds);

    void deleteByTenantIdAndStatus(UUID tenantId, DiscAssessmentStatus status);
}
