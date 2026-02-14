package com.axonrh.performance.repository;

import com.axonrh.performance.entity.Evaluation;
import com.axonrh.performance.entity.enums.EvaluationStatus;
import com.axonrh.performance.entity.enums.EvaluatorType;
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
public interface EvaluationRepository extends JpaRepository<Evaluation, UUID> {

    Optional<Evaluation> findByTenantIdAndId(UUID tenantId, UUID id);

    // Avaliacoes do avaliador
    List<Evaluation> findByTenantIdAndEvaluatorIdOrderByDueDateAsc(UUID tenantId, UUID evaluatorId);

    // Avaliacoes do colaborador (onde ele eh avaliado)
    List<Evaluation> findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(UUID tenantId, UUID employeeId);

    // Avaliacoes por ciclo
    @Query("SELECT e FROM Evaluation e WHERE e.tenantId = :tenantId AND e.cycle.id = :cycleId")
    Page<Evaluation> findByTenantIdAndCycleId(@Param("tenantId") UUID tenantId, 
                                             @Param("cycleId") UUID cycleId, 
                                             Pageable pageable);

    // Avaliacoes pendentes do avaliador
    @Query("SELECT e FROM Evaluation e WHERE e.tenantId = :tenantId " +
           "AND e.evaluatorId = :evaluatorId " +
           "AND e.status IN ('PENDING', 'IN_PROGRESS')")
    List<Evaluation> findPendingByEvaluator(@Param("tenantId") UUID tenantId,
                                            @Param("evaluatorId") UUID evaluatorId);

    // Avaliacoes por status
    List<Evaluation> findByTenantIdAndCycleIdAndStatus(UUID tenantId, UUID cycleId, EvaluationStatus status);

    // Avaliacoes atrasadas
    @Query("SELECT e FROM Evaluation e WHERE e.tenantId = :tenantId " +
           "AND e.dueDate < :date " +
           "AND e.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<Evaluation> findOverdue(@Param("tenantId") UUID tenantId, @Param("date") LocalDate date);

    @Query("SELECT e FROM Evaluation e WHERE e.dueDate < :date " +
           "AND e.status IN ('PENDING', 'IN_PROGRESS')")
    List<Evaluation> findAllOverdue(@Param("date") LocalDate date);

    // Para matriz 9Box
    @Query("SELECT e FROM Evaluation e WHERE e.tenantId = :tenantId " +
           "AND e.cycle.id = :cycleId " +
           "AND e.evaluatorType = :type " +
           "AND e.status = 'COMPLETED' " +
           "AND e.performanceScore IS NOT NULL " +
           "AND e.potentialScore IS NOT NULL")
    List<Evaluation> findCompletedForNineBox(@Param("tenantId") UUID tenantId,
                                              @Param("cycleId") UUID cycleId,
                                              @Param("type") EvaluatorType type);

    // Estatisticas
    @Query("SELECT COUNT(e) FROM Evaluation e WHERE e.tenantId = :tenantId " +
           "AND e.cycle.id = :cycleId AND e.status = :status")
    long countByCycleAndStatus(@Param("tenantId") UUID tenantId,
                               @Param("cycleId") UUID cycleId,
                               @Param("status") EvaluationStatus status);

    // Verificar se ja existe avaliacao
    @Query("SELECT COUNT(e) > 0 FROM Evaluation e WHERE e.tenantId = :tenantId " +
           "AND e.cycle.id = :cycleId AND e.employeeId = :employeeId " +
           "AND e.evaluatorId = :evaluatorId AND e.evaluatorType = :evaluatorType")
    boolean existsByTenantIdAndCycleIdAndEmployeeIdAndEvaluatorIdAndEvaluatorType(
            @Param("tenantId") UUID tenantId, 
            @Param("cycleId") UUID cycleId, 
            @Param("employeeId") UUID employeeId, 
            @Param("evaluatorId") UUID evaluatorId, 
            @Param("evaluatorType") EvaluatorType evaluatorType);

    // Contar avaliacoes por ciclo
    long countByTenantIdAndCycleId(UUID tenantId, UUID cycleId);

    List<Evaluation> findByTenantIdAndCycleId(UUID tenantId, UUID cycleId);
}
