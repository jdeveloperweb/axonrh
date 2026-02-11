package com.axonrh.payroll.repository;

import com.axonrh.payroll.entity.PayrollRun;
import com.axonrh.payroll.enums.PayrollRunStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollRunRepository extends JpaRepository<PayrollRun, UUID> {

    Optional<PayrollRun> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<PayrollRun> findByTenantIdAndReferenceMonthAndReferenceYearAndStatusNot(
            UUID tenantId, Integer month, Integer year, PayrollRunStatus status);

    Page<PayrollRun> findByTenantIdOrderByReferenceYearDescReferenceMonthDesc(UUID tenantId, Pageable pageable);

    boolean existsByTenantIdAndReferenceMonthAndReferenceYearAndStatus(
            UUID tenantId, Integer month, Integer year, PayrollRunStatus status);
}
