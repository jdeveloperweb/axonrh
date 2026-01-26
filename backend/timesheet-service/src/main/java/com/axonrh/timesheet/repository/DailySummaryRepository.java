package com.axonrh.timesheet.repository;

import com.axonrh.timesheet.entity.DailySummary;
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
public interface DailySummaryRepository extends JpaRepository<DailySummary, UUID> {

    // Busca por tenant, colaborador e data
    Optional<DailySummary> findByTenantIdAndEmployeeIdAndSummaryDate(
            UUID tenantId, UUID employeeId, LocalDate summaryDate);

    // Espelho de ponto em periodo
    List<DailySummary> findByTenantIdAndEmployeeIdAndSummaryDateBetweenOrderBySummaryDateAsc(
            UUID tenantId, UUID employeeId, LocalDate startDate, LocalDate endDate);

    // Dias com pendencias
    @Query("""
        SELECT ds FROM DailySummary ds
        WHERE ds.tenantId = :tenantId
        AND ds.employeeId = :employeeId
        AND (ds.hasPendingRecords = true OR ds.hasMissingRecords = true)
        AND ds.summaryDate BETWEEN :startDate AND :endDate
        ORDER BY ds.summaryDate ASC
        """)
    List<DailySummary> findWithPendencies(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Dias com faltas
    List<DailySummary> findByTenantIdAndEmployeeIdAndIsAbsentTrueAndSummaryDateBetween(
            UUID tenantId, UUID employeeId, LocalDate startDate, LocalDate endDate);

    // Dias com horas extras
    @Query("""
        SELECT ds FROM DailySummary ds
        WHERE ds.tenantId = :tenantId
        AND ds.employeeId = :employeeId
        AND ds.overtimeMinutes > 0
        AND ds.summaryDate BETWEEN :startDate AND :endDate
        ORDER BY ds.summaryDate ASC
        """)
    List<DailySummary> findWithOvertime(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Dias nao fechados
    Page<DailySummary> findByTenantIdAndIsClosedFalseAndSummaryDateBefore(
            UUID tenantId, LocalDate beforeDate, Pageable pageable);

    // Totais em periodo
    @Query("""
        SELECT
            SUM(ds.workedMinutes),
            SUM(ds.overtimeMinutes),
            SUM(ds.deficitMinutes),
            SUM(ds.nightShiftMinutes),
            SUM(ds.lateArrivalMinutes),
            COUNT(CASE WHEN ds.isAbsent = true THEN 1 END)
        FROM DailySummary ds
        WHERE ds.tenantId = :tenantId
        AND ds.employeeId = :employeeId
        AND ds.summaryDate BETWEEN :startDate AND :endDate
        """)
    Object[] getTotalsInPeriod(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Resumo por departamento
    @Query("""
        SELECT ds.employeeId,
            SUM(ds.workedMinutes),
            SUM(ds.overtimeMinutes),
            COUNT(CASE WHEN ds.isAbsent = true THEN 1 END)
        FROM DailySummary ds
        WHERE ds.tenantId = :tenantId
        AND ds.employeeId IN :employeeIds
        AND ds.summaryDate BETWEEN :startDate AND :endDate
        GROUP BY ds.employeeId
        """)
    List<Object[]> getSummaryByEmployees(
            @Param("tenantId") UUID tenantId,
            @Param("employeeIds") List<UUID> employeeIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Colaboradores com pendencias
    @Query("""
        SELECT DISTINCT ds.employeeId
        FROM DailySummary ds
        WHERE ds.tenantId = :tenantId
        AND (ds.hasPendingRecords = true OR ds.hasMissingRecords = true)
        AND ds.isClosed = false
        AND ds.summaryDate BETWEEN :startDate AND :endDate
        """)
    List<UUID> findEmployeesWithPendencies(
            @Param("tenantId") UUID tenantId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Verificar se periodo esta fechado
    @Query("""
        SELECT COUNT(ds) = 0
        FROM DailySummary ds
        WHERE ds.tenantId = :tenantId
        AND ds.employeeId = :employeeId
        AND ds.isClosed = false
        AND ds.summaryDate BETWEEN :startDate AND :endDate
        """)
    boolean isPeriodClosed(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
