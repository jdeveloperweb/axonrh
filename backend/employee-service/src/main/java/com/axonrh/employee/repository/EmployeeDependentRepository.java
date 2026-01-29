package com.axonrh.employee.repository;

import com.axonrh.employee.entity.EmployeeDependent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeDependentRepository extends JpaRepository<EmployeeDependent, UUID> {
    List<EmployeeDependent> findByTenantIdAndEmployeeId(UUID tenantId, UUID employeeId);
    Optional<EmployeeDependent> findByTenantIdAndId(UUID tenantId, UUID id);
}
