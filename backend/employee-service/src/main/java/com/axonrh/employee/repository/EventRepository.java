package com.axonrh.employee.repository;

import com.axonrh.employee.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByTenantIdOrderByDateAsc(UUID tenantId);
    List<Event> findByTenantIdAndCategoryOrderByDateAsc(UUID tenantId, String category);
}
