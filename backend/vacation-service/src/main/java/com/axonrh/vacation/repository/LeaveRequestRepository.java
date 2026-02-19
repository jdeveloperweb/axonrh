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
    
    @org.springframework.data.jpa.repository.Query("SELECT l FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.status = 'APPROVED' AND :today BETWEEN l.startDate AND l.endDate")
    List<LeaveRequest> findActiveLeaves(UUID tenantId, java.time.LocalDate today);
}
