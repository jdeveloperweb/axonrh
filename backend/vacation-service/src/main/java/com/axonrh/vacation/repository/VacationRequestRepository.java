package com.axonrh.vacation.repository;

import com.axonrh.vacation.entity.VacationRequest;
import com.axonrh.vacation.entity.enums.VacationRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VacationRequestRepository extends JpaRepository<VacationRequest, UUID> {

    Optional<VacationRequest> findByTenantIdAndId(UUID tenantId, UUID id);

    Page<VacationRequest> findByTenantIdAndStatusOrderByCreatedAtAsc(
            UUID tenantId,
            VacationRequestStatus status,
            Pageable pageable
    );

    List<VacationRequest> findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(
            UUID tenantId,
            UUID employeeId
    );

    long countByVacationPeriodIdAndStatusNot(UUID vacationPeriodId, VacationRequestStatus status);

    long countByVacationPeriodIdAndStatusIn(UUID vacationPeriodId, List<VacationRequestStatus> status);

    List<VacationRequest> findByTenantIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            UUID tenantId,
            VacationRequestStatus status,
            java.time.LocalDate endDate,
            java.time.LocalDate startDate
    );
}
