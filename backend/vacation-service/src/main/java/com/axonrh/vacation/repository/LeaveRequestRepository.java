package com.axonrh.vacation.repository;

import com.axonrh.vacation.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    List<LeaveRequest> findByTenantId(UUID tenantId);
    List<LeaveRequest> findByTenantIdAndEmployeeId(UUID tenantId, UUID employeeId);
}
