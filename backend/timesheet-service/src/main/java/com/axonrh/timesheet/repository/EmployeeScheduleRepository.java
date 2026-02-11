package com.axonrh.timesheet.repository;

import com.axonrh.timesheet.entity.EmployeeSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeScheduleRepository extends JpaRepository<EmployeeSchedule, UUID> {

    @Query("SELECT es FROM EmployeeSchedule es JOIN FETCH es.workSchedule " +
           "WHERE es.tenantId = :tenantId AND es.employeeId IN :employeeIds " +
           "AND es.validFrom <= :date " +
           "AND (es.validUntil IS NULL OR es.validUntil >= :date) " +
           "ORDER BY es.validFrom DESC")
    List<EmployeeSchedule> findActiveSchedules(
            @Param("tenantId") UUID tenantId,
            @Param("employeeIds") List<UUID> employeeIds,
            @Param("date") LocalDate date);

    @Query("SELECT es FROM EmployeeSchedule es JOIN FETCH es.workSchedule " +
           "WHERE es.tenantId = :tenantId AND es.employeeId IN :employeeIds " +
           "ORDER BY es.validFrom DESC")
    List<EmployeeSchedule> findAllByEmployeeIds(
            @Param("tenantId") UUID tenantId,
            @Param("employeeIds") List<UUID> employeeIds);

    @Query("SELECT es FROM EmployeeSchedule es JOIN FETCH es.workSchedule " +
           "WHERE es.employeeId IN :employeeIds " +
           "ORDER BY es.validFrom DESC")
    List<EmployeeSchedule> findAllByEmployeeIdsAnyTenant(
            @Param("employeeIds") List<UUID> employeeIds);

    @Query("SELECT DISTINCT es.employeeId FROM EmployeeSchedule es WHERE es.tenantId = :tenantId")
    List<UUID> findDistinctEmployeeIdsByTenantId(@Param("tenantId") UUID tenantId);
}
