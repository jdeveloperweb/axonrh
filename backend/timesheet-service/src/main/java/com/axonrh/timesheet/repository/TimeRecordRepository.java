package com.axonrh.timesheet.repository;

import com.axonrh.timesheet.entity.TimeRecord;
import com.axonrh.timesheet.entity.enums.RecordStatus;
import com.axonrh.timesheet.entity.enums.RecordType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TimeRecordRepository extends JpaRepository<TimeRecord, UUID> {

    // Busca por tenant e ID
    Optional<TimeRecord> findByTenantIdAndId(UUID tenantId, UUID id);

    // Registros de um colaborador em uma data
    List<TimeRecord> findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(
            UUID tenantId, UUID employeeId, LocalDate recordDate);

    // Registros de um colaborador em um periodo
    List<TimeRecord> findByTenantIdAndEmployeeIdAndRecordDateBetweenOrderByRecordDateAscRecordTimeAsc(
            UUID tenantId, UUID employeeId, LocalDate startDate, LocalDate endDate);

    // Registros pendentes de aprovacao
    Page<TimeRecord> findByTenantIdAndStatusOrderByRecordDatetimeDesc(
            UUID tenantId, RecordStatus status, Pageable pageable);

    // Registros pendentes para um gestor (por departamento)
    @Query("""
        SELECT tr FROM TimeRecord tr
        WHERE tr.tenantId = :tenantId
        AND tr.status = 'PENDING_APPROVAL'
        AND tr.employeeId IN :employeeIds
        ORDER BY tr.recordDatetime DESC
        """)
    Page<TimeRecord> findPendingByEmployees(
            @Param("tenantId") UUID tenantId,
            @Param("employeeIds") List<UUID> employeeIds,
            Pageable pageable);

    // Ultimo registro do colaborador
    Optional<TimeRecord> findFirstByTenantIdAndEmployeeIdOrderByRecordDatetimeDesc(
            UUID tenantId, UUID employeeId);

    // Ultimo registro do colaborador no dia
    Optional<TimeRecord> findFirstByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeDesc(
            UUID tenantId, UUID employeeId, LocalDate recordDate);

    // Registros por tipo em uma data
    List<TimeRecord> findByTenantIdAndEmployeeIdAndRecordDateAndRecordType(
            UUID tenantId, UUID employeeId, LocalDate recordDate, RecordType recordType);

    // Contagem de registros pendentes
    long countByTenantIdAndStatus(UUID tenantId, RecordStatus status);

    // Contagem por status em um periodo
    @Query("""
        SELECT tr.status, COUNT(tr)
        FROM TimeRecord tr
        WHERE tr.tenantId = :tenantId
        AND tr.recordDate BETWEEN :startDate AND :endDate
        GROUP BY tr.status
        """)
    List<Object[]> countByStatusInPeriod(
            @Param("tenantId") UUID tenantId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Registros fora do geofence
    @Query("""
        SELECT tr FROM TimeRecord tr
        WHERE tr.tenantId = :tenantId
        AND tr.withinGeofence = false
        AND tr.recordDate BETWEEN :startDate AND :endDate
        ORDER BY tr.recordDatetime DESC
        """)
    List<TimeRecord> findOutsideGeofence(
            @Param("tenantId") UUID tenantId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Verifica se ja existe registro no mesmo minuto (evitar duplicatas)
    boolean existsByTenantIdAndEmployeeIdAndRecordDateAndRecordTypeAndRecordTime(
            UUID tenantId, UUID employeeId, LocalDate recordDate, RecordType recordType, java.time.LocalTime recordTime);

    // Busca registros para calculo de horas
    @Query("""
        SELECT tr FROM TimeRecord tr
        WHERE tr.tenantId = :tenantId
        AND tr.employeeId = :employeeId
        AND tr.recordDate = :date
        AND tr.status IN ('VALID', 'APPROVED', 'ADJUSTED')
        ORDER BY tr.recordTime ASC
        """)
    List<TimeRecord> findValidRecordsForDate(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("date") LocalDate date);

    // Registros importados de AFD por NSR
    Optional<TimeRecord> findByTenantIdAndRepIdAndNsr(UUID tenantId, String repId, Long nsr);
}
