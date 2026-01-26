package com.axonrh.timesheet.repository;

import com.axonrh.timesheet.entity.WorkSchedule;
import com.axonrh.timesheet.entity.enums.ScheduleType;
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
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, UUID> {

    // Busca por tenant e ID
    Optional<WorkSchedule> findByTenantIdAndId(UUID tenantId, UUID id);

    // Busca por tenant e ID com dias da semana
    @Query("""
        SELECT ws FROM WorkSchedule ws
        LEFT JOIN FETCH ws.scheduleDays
        WHERE ws.tenantId = :tenantId AND ws.id = :id
        """)
    Optional<WorkSchedule> findByTenantIdAndIdWithDays(@Param("tenantId") UUID tenantId, @Param("id") UUID id);

    // Lista todas as escalas ativas de um tenant
    List<WorkSchedule> findByTenantIdAndActiveTrue(UUID tenantId);

    // Lista paginada
    Page<WorkSchedule> findByTenantIdOrderByNameAsc(UUID tenantId, Pageable pageable);

    // Busca por nome
    Optional<WorkSchedule> findByTenantIdAndName(UUID tenantId, String name);

    // Busca por tipo
    List<WorkSchedule> findByTenantIdAndScheduleTypeAndActiveTrue(UUID tenantId, ScheduleType scheduleType);

    // Escalas vigentes em uma data
    @Query("""
        SELECT ws FROM WorkSchedule ws
        WHERE ws.tenantId = :tenantId
        AND ws.active = true
        AND (ws.validFrom IS NULL OR ws.validFrom <= :date)
        AND (ws.validUntil IS NULL OR ws.validUntil >= :date)
        """)
    List<WorkSchedule> findActiveOnDate(@Param("tenantId") UUID tenantId, @Param("date") LocalDate date);

    // Escalas com banco de horas habilitado
    List<WorkSchedule> findByTenantIdAndOvertimeBankEnabledTrueAndActiveTrue(UUID tenantId);

    // Contagem de escalas ativas
    long countByTenantIdAndActiveTrue(UUID tenantId);

    // Verifica se nome ja existe
    boolean existsByTenantIdAndNameAndIdNot(UUID tenantId, String name, UUID id);

    // Busca escalas por acordo coletivo
    List<WorkSchedule> findByTenantIdAndUnionAgreementIdAndActiveTrue(UUID tenantId, UUID unionAgreementId);
}
