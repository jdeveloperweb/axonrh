package com.axonrh.performance.repository;

import com.axonrh.performance.entity.EvaluationCycle;
import com.axonrh.performance.entity.enums.CycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EvaluationCycleRepository extends JpaRepository<EvaluationCycle, UUID> {

    List<EvaluationCycle> findByTenantIdOrderByStartDateDesc(UUID tenantId);

    List<EvaluationCycle> findByTenantIdAndStatus(UUID tenantId, CycleStatus status);

    Optional<EvaluationCycle> findByTenantIdAndId(UUID tenantId, UUID id);

    @Query("SELECT c FROM EvaluationCycle c WHERE c.tenantId = :tenantId " +
           "AND c.status = 'ACTIVE' " +
           "AND :date BETWEEN c.startDate AND c.endDate")
    List<EvaluationCycle> findActiveCycles(@Param("tenantId") UUID tenantId,
                                           @Param("date") LocalDate date);

    @Query("SELECT c FROM EvaluationCycle c WHERE c.tenantId = :tenantId " +
           "AND c.endDate < :date AND c.status = 'ACTIVE'")
    List<EvaluationCycle> findOverdueCycles(@Param("tenantId") UUID tenantId,
                                            @Param("date") LocalDate date);

    boolean existsByTenantIdAndNameAndIdNot(UUID tenantId, String name, UUID id);
}
