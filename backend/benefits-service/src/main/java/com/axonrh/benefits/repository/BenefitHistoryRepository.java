package com.axonrh.benefits.repository;

import com.axonrh.benefits.entity.BenefitHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BenefitHistoryRepository extends JpaRepository<BenefitHistory, UUID> {

    Page<BenefitHistory> findByTenantIdAndEmployeeIdOrderByChangedAtDesc(
            UUID tenantId, UUID employeeId, Pageable pageable);

    List<BenefitHistory> findByTenantIdAndEmployeeBenefitIdOrderByChangedAtDesc(
            UUID tenantId, UUID employeeBenefitId);
}
