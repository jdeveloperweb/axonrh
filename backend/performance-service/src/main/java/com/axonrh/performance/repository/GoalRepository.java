package com.axonrh.performance.repository;

import com.axonrh.performance.entity.Goal;
import com.axonrh.performance.entity.enums.GoalStatus;
import com.axonrh.performance.entity.enums.GoalType;
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
public interface GoalRepository extends JpaRepository<Goal, UUID> {

    Optional<Goal> findByTenantIdAndId(UUID tenantId, UUID id);

    // Metas do colaborador
    List<Goal> findByTenantIdAndEmployeeIdOrderByDueDateAsc(UUID tenantId, UUID employeeId);

    // Metas por departamento
    List<Goal> findByTenantIdAndDepartmentIdOrderByDueDateAsc(UUID tenantId, UUID departmentId);

    // Metas por ciclo
    Page<Goal> findByTenantIdAndCycleId(UUID tenantId, UUID cycleId, Pageable pageable);

    // Metas por status
    List<Goal> findByTenantIdAndEmployeeIdAndStatus(UUID tenantId, UUID employeeId, GoalStatus status);

    // Metas atrasadas
    @Query("SELECT g FROM Goal g WHERE g.tenantId = :tenantId " +
           "AND g.dueDate < :date " +
           "AND g.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<Goal> findOverdue(@Param("tenantId") UUID tenantId, @Param("date") LocalDate date);

    // Metas em risco
    @Query("SELECT g FROM Goal g WHERE g.tenantId = :tenantId " +
           "AND g.status = 'AT_RISK'")
    List<Goal> findAtRisk(@Param("tenantId") UUID tenantId);

    // Key Results
    List<Goal> findByTenantIdAndParentGoalId(UUID tenantId, UUID parentGoalId);

    // OKRs da empresa
    @Query("SELECT g FROM Goal g WHERE g.tenantId = :tenantId " +
           "AND g.goalType = :type " +
           "AND g.cycleId = :cycleId")
    List<Goal> findByTypeAndCycle(@Param("tenantId") UUID tenantId,
                                  @Param("type") GoalType type,
                                  @Param("cycleId") UUID cycleId);

    // Estatisticas
    @Query("SELECT AVG(g.progressPercentage) FROM Goal g WHERE g.tenantId = :tenantId " +
           "AND g.employeeId = :employeeId " +
           "AND g.status NOT IN ('CANCELLED')")
    Double calculateAverageProgress(@Param("tenantId") UUID tenantId,
                                    @Param("employeeId") UUID employeeId);

    @Query("SELECT COUNT(g) FROM Goal g WHERE g.tenantId = :tenantId " +
           "AND g.employeeId = :employeeId AND g.status = :status")
    long countByEmployeeAndStatus(@Param("tenantId") UUID tenantId,
                                  @Param("employeeId") UUID employeeId,
                                  @Param("status") GoalStatus status);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Goal g SET g.cycleId = NULL WHERE g.tenantId = :tenantId AND g.cycleId = :cycleId")
    void clearCycleId(@Param("tenantId") UUID tenantId, @Param("cycleId") UUID cycleId);
}
