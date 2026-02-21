package com.axonrh.employee.repository;

import com.axonrh.employee.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, UUID> {
    List<EventRegistration> findByEmployeeId(UUID employeeId);
    Optional<EventRegistration> findByEventIdAndEmployeeId(UUID eventId, UUID employeeId);
    boolean existsByEventIdAndEmployeeId(UUID eventId, UUID employeeId);
    long countByEventId(UUID eventId);
}
