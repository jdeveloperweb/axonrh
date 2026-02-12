package com.axonrh.vacation.repository;

import com.axonrh.vacation.entity.VacationPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VacationPeriodRepository extends JpaRepository<VacationPeriod, UUID> {

    Optional<VacationPeriod> findTopByTenantIdAndEmployeeIdOrderByAcquisitionEndDateDesc(
            UUID tenantId,
            UUID employeeId
    );

    List<VacationPeriod> findByTenantIdAndEmployeeIdOrderByAcquisitionStartDateDesc(
            UUID tenantId,
            UUID employeeId
    );

    Optional<VacationPeriod> findByTenantIdAndEmployeeIdAndAcquisitionStartDate(UUID tenantId, UUID employeeId, LocalDate acquisitionStartDate);

    Optional<VacationPeriod> findByTenantIdAndId(UUID tenantId, UUID id);

    @Query("""
            select period
            from VacationPeriod period
            where period.tenantId = :tenantId
              and period.concessionEndDate between :startDate and :endDate
            """)
    List<VacationPeriod> findExpiringPeriods(
            @Param("tenantId") UUID tenantId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
