package com.axonrh.timesheet.repository;

import com.axonrh.timesheet.entity.OvertimeBank;
import com.axonrh.timesheet.entity.enums.OvertimeBankType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OvertimeBankRepository extends JpaRepository<OvertimeBank, UUID> {

    // Busca por tenant e ID
    Optional<OvertimeBank> findByTenantIdAndId(UUID tenantId, UUID id);

    // Movimentacoes de um colaborador
    Page<OvertimeBank> findByTenantIdAndEmployeeIdOrderByReferenceDateDesc(
            UUID tenantId, UUID employeeId, Pageable pageable);

    // Movimentacoes em um periodo
    List<OvertimeBank> findByTenantIdAndEmployeeIdAndReferenceDateBetweenOrderByReferenceDateAsc(
            UUID tenantId, UUID employeeId, LocalDate startDate, LocalDate endDate);

    // Saldo atual (ultima movimentacao)
    @Query("""
        SELECT ob FROM OvertimeBank ob
        WHERE ob.tenantId = :tenantId
        AND ob.employeeId = :employeeId
        ORDER BY ob.createdAt DESC
        LIMIT 1
        """)
    Optional<OvertimeBank> findLatestByEmployee(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId);

    // Calcula saldo atual
    @Query("""
        SELECT COALESCE(SUM(ob.minutes), 0)
        FROM OvertimeBank ob
        WHERE ob.tenantId = :tenantId
        AND ob.employeeId = :employeeId
        AND ob.expired = false
        """)
    Integer calculateCurrentBalance(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId);

    // Horas a expirar
    @Query("""
        SELECT ob FROM OvertimeBank ob
        WHERE ob.tenantId = :tenantId
        AND ob.type = 'CREDIT'
        AND ob.expired = false
        AND ob.expirationDate IS NOT NULL
        AND ob.expirationDate <= :date
        """)
    List<OvertimeBank> findExpiredCredits(
            @Param("tenantId") UUID tenantId,
            @Param("date") LocalDate date);

    // Horas proximas de expirar (alerta)
    @Query("""
        SELECT ob FROM OvertimeBank ob
        WHERE ob.tenantId = :tenantId
        AND ob.employeeId = :employeeId
        AND ob.type = 'CREDIT'
        AND ob.expired = false
        AND ob.expirationDate IS NOT NULL
        AND ob.expirationDate BETWEEN :startDate AND :endDate
        """)
    List<OvertimeBank> findCreditsExpiringSoon(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Marca horas como expiradas
    @Modifying
    @Query("""
        UPDATE OvertimeBank ob
        SET ob.expired = true
        WHERE ob.tenantId = :tenantId
        AND ob.type = 'CREDIT'
        AND ob.expired = false
        AND ob.expirationDate IS NOT NULL
        AND ob.expirationDate <= :date
        """)
    int markExpiredCredits(@Param("tenantId") UUID tenantId, @Param("date") LocalDate date);

    // Resumo por tipo em periodo
    @Query("""
        SELECT ob.type, SUM(ob.minutes)
        FROM OvertimeBank ob
        WHERE ob.tenantId = :tenantId
        AND ob.employeeId = :employeeId
        AND ob.referenceDate BETWEEN :startDate AND :endDate
        GROUP BY ob.type
        """)
    List<Object[]> summarizeByTypeInPeriod(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Total de creditos e debitos para relatorio
    @Query("""
        SELECT
            SUM(CASE WHEN ob.type = 'CREDIT' THEN ob.minutes ELSE 0 END),
            SUM(CASE WHEN ob.type = 'DEBIT' THEN ABS(ob.minutes) ELSE 0 END),
            SUM(CASE WHEN ob.type = 'EXPIRATION' THEN ABS(ob.minutes) ELSE 0 END),
            SUM(CASE WHEN ob.type = 'PAYOUT' THEN ABS(ob.minutes) ELSE 0 END)
        FROM OvertimeBank ob
        WHERE ob.tenantId = :tenantId
        AND ob.employeeId = :employeeId
        AND ob.referenceDate BETWEEN :startDate AND :endDate
        """)
    Object[] getTotalsInPeriod(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Colaboradores com saldo negativo
    @Query("""
        SELECT ob.employeeId, SUM(ob.minutes) as balance
        FROM OvertimeBank ob
        WHERE ob.tenantId = :tenantId
        AND ob.expired = false
        GROUP BY ob.employeeId
        HAVING SUM(ob.minutes) < 0
        """)
    List<Object[]> findEmployeesWithNegativeBalance(@Param("tenantId") UUID tenantId);
}
