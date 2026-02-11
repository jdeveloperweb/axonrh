package com.axonrh.payroll.repository;

import com.axonrh.payroll.entity.Payroll;
import com.axonrh.payroll.enums.PayrollStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, UUID>, JpaSpecificationExecutor<Payroll> {

    Optional<Payroll> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<Payroll> findByTenantIdAndEmployeeIdAndReferenceMonthAndReferenceYear(
            UUID tenantId, UUID employeeId, Integer referenceMonth, Integer referenceYear);

    Page<Payroll> findByTenantIdAndReferenceMonthAndReferenceYear(
            UUID tenantId, Integer referenceMonth, Integer referenceYear, Pageable pageable);

    List<Payroll> findByTenantIdAndEmployeeIdOrderByReferenceYearDescReferenceMonthDesc(
            UUID tenantId, UUID employeeId);

    Page<Payroll> findByTenantId(UUID tenantId, Pageable pageable);

    @Query("SELECT p FROM Payroll p LEFT JOIN FETCH p.items WHERE p.tenantId = :tenantId AND p.id = :id")
    Optional<Payroll> findByIdWithItems(@Param("tenantId") UUID tenantId, @Param("id") UUID id);

    long countByTenantIdAndReferenceMonthAndReferenceYearAndStatus(
            UUID tenantId, Integer month, Integer year, PayrollStatus status);

    boolean existsByTenantIdAndEmployeeIdAndReferenceMonthAndReferenceYearAndStatusNot(
            UUID tenantId, UUID employeeId, Integer month, Integer year, PayrollStatus status);
}
