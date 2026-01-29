package com.axonrh.employee.repository;

import com.axonrh.employee.entity.TerminationProcess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TerminationProcessRepository extends JpaRepository<TerminationProcess, UUID> {
    Optional<TerminationProcess> findByEmployeeId(UUID employeeId);
}
