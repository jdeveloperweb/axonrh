package com.axonrh.employee.repository;

import com.axonrh.employee.entity.EmployeeWellbeing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeWellbeingRepository extends JpaRepository<EmployeeWellbeing, UUID> {
    List<EmployeeWellbeing> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);
}
