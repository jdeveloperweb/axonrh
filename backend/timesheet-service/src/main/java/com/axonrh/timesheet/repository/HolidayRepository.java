package com.axonrh.timesheet.repository;

import com.axonrh.timesheet.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, UUID> {
    List<Holiday> findAllByTenantId(UUID tenantId);
    Optional<Holiday> findByTenantIdAndDate(UUID tenantId, LocalDate date);
    int deleteByTenantIdAndTypeAndDateBetween(UUID tenantId, String type, LocalDate start, LocalDate end);
    void deleteAllByTenantId(UUID tenantId);
}
