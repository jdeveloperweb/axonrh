package com.axonrh.learning.repository;

import com.axonrh.learning.entity.PathEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PathEnrollmentRepository extends JpaRepository<PathEnrollment, UUID> {
    List<PathEnrollment> findByTenantIdAndEmployeeId(UUID tenantId, UUID employeeId);
}
