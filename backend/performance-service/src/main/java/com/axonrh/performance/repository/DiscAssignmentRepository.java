package com.axonrh.performance.repository;

import com.axonrh.performance.entity.DiscAssignment;
import com.axonrh.performance.entity.enums.DiscAssessmentStatus;
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
public interface DiscAssignmentRepository extends JpaRepository<DiscAssignment, UUID> {

    Optional<DiscAssignment> findByTenantIdAndId(UUID tenantId, UUID id);

    // Atribuicoes pendentes para um colaborador
    List<DiscAssignment> findByTenantIdAndEmployeeIdAndStatus(
        UUID tenantId, UUID employeeId, DiscAssessmentStatus status);

    List<DiscAssignment> findByTenantIdAndEmployeeIdAndStatusIn(
        UUID tenantId, UUID employeeId, List<DiscAssessmentStatus> statuses);

    // Verificar se colaborador tem atribuicao pendente
    boolean existsByTenantIdAndEmployeeIdAndStatusIn(
        UUID tenantId, UUID employeeId, List<DiscAssessmentStatus> statuses);

    // Listagem paginada
    Page<DiscAssignment> findByTenantId(UUID tenantId, Pageable pageable);

    Page<DiscAssignment> findByTenantIdAndStatus(UUID tenantId, DiscAssessmentStatus status, Pageable pageable);

    // Por quem atribuiu
    List<DiscAssignment> findByTenantIdAndAssignedByOrderByCreatedAtDesc(UUID tenantId, UUID assignedBy);

    // Atribuicoes atrasadas
    @Query("SELECT a FROM DiscAssignment a WHERE a.tenantId = :tenantId " +
           "AND a.dueDate < :date AND a.status = 'PENDING'")
    List<DiscAssignment> findOverdue(@Param("tenantId") UUID tenantId, @Param("date") LocalDate date);

    @Query("SELECT a FROM DiscAssignment a WHERE a.status = 'PENDING'")
    List<DiscAssignment> findAllPending();

    // Estatisticas
    long countByTenantIdAndStatus(UUID tenantId, DiscAssessmentStatus status);

    void deleteByTenantIdAndStatus(UUID tenantId, DiscAssessmentStatus status);
}
