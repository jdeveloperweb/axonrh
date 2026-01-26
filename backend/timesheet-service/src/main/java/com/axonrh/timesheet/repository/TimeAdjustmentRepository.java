package com.axonrh.timesheet.repository;

import com.axonrh.timesheet.entity.TimeAdjustment;
import com.axonrh.timesheet.entity.enums.AdjustmentStatus;
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
public interface TimeAdjustmentRepository extends JpaRepository<TimeAdjustment, UUID> {

    // Busca por tenant e ID
    Optional<TimeAdjustment> findByTenantIdAndId(UUID tenantId, UUID id);

    // Ajustes de um colaborador
    Page<TimeAdjustment> findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(
            UUID tenantId, UUID employeeId, Pageable pageable);

    // Ajustes pendentes de um tenant
    Page<TimeAdjustment> findByTenantIdAndStatusOrderByCreatedAtAsc(
            UUID tenantId, AdjustmentStatus status, Pageable pageable);

    // Ajustes pendentes para um aprovador
    Page<TimeAdjustment> findByTenantIdAndApproverIdAndStatusOrderByCreatedAtAsc(
            UUID tenantId, UUID approverId, AdjustmentStatus status, Pageable pageable);

    // Ajustes pendentes por lista de colaboradores (para gestores)
    @Query("""
        SELECT ta FROM TimeAdjustment ta
        WHERE ta.tenantId = :tenantId
        AND ta.status = :status
        AND ta.employeeId IN :employeeIds
        ORDER BY ta.createdAt ASC
        """)
    Page<TimeAdjustment> findByEmployeesAndStatus(
            @Param("tenantId") UUID tenantId,
            @Param("employeeIds") List<UUID> employeeIds,
            @Param("status") AdjustmentStatus status,
            Pageable pageable);

    // Ajustes em um periodo
    List<TimeAdjustment> findByTenantIdAndEmployeeIdAndRecordDateBetween(
            UUID tenantId, UUID employeeId, LocalDate startDate, LocalDate endDate);

    // Contagem por status
    long countByTenantIdAndStatus(UUID tenantId, AdjustmentStatus status);

    // Contagem pendentes para um aprovador
    long countByTenantIdAndApproverIdAndStatus(UUID tenantId, UUID approverId, AdjustmentStatus status);

    // Estatisticas por status em periodo
    @Query("""
        SELECT ta.status, COUNT(ta)
        FROM TimeAdjustment ta
        WHERE ta.tenantId = :tenantId
        AND ta.createdAt BETWEEN :startDate AND :endDate
        GROUP BY ta.status
        """)
    List<Object[]> countByStatusInPeriod(
            @Param("tenantId") UUID tenantId,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate);

    // Verifica se ja existe ajuste pendente para o mesmo registro
    boolean existsByTenantIdAndOriginalRecordIdAndStatus(
            UUID tenantId, UUID originalRecordId, AdjustmentStatus status);

    // Ajustes por data especifica
    List<TimeAdjustment> findByTenantIdAndEmployeeIdAndRecordDate(
            UUID tenantId, UUID employeeId, LocalDate recordDate);
}
