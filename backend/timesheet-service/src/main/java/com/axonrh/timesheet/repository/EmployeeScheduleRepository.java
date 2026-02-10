package com.axonrh.timesheet.repository;

import com.axonrh.timesheet.entity.EmployeeSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeScheduleRepository extends JpaRepository<EmployeeSchedule, UUID> {

    @Query("SELECT es FROM EmployeeSchedule es " +
           "WHERE es.tenantId = :tenantId AND es.employeeId = :employeeId " +
           "AND es.validFrom <= :date " +
           "AND (es.validUntil IS NULL OR es.validUntil >= :date) " +
           "ORDER BY es.validFrom DESC LIMIT 1")
    Optional<EmployeeSchedule> findActiveSchedule(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("date") LocalDate date);

    @Query("SELECT DISTINCT es.employeeId FROM EmployeeSchedule es WHERE es.tenantId = :tenantId")
    List<UUID> findDistinctEmployeeIdsByTenantId(@Param("tenantId") UUID tenantId);
}
