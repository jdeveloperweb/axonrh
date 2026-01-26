package com.axonrh.employee.repository;

import com.axonrh.employee.entity.EmployeeHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeHistoryRepository extends JpaRepository<EmployeeHistory, UUID> {

    Page<EmployeeHistory> findByTenantIdAndEmployeeIdOrderByChangedAtDesc(
            UUID tenantId, UUID employeeId, Pageable pageable);

    List<EmployeeHistory> findByTenantIdAndEmployeeIdAndChangeType(
            UUID tenantId, UUID employeeId, String changeType);

    List<EmployeeHistory> findByTenantIdAndEmployeeIdAndChangedAtBetween(
            UUID tenantId, UUID employeeId, LocalDateTime start, LocalDateTime end);

    long countByTenantIdAndEmployeeId(UUID tenantId, UUID employeeId);
}
