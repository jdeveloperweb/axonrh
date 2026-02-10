package com.axonrh.timesheet.controller;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.entity.Holiday;
import com.axonrh.timesheet.service.HolidayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/timesheet/holidays")
@RequiredArgsConstructor
public class HolidayController {

    private final HolidayService holidayService;

    @GetMapping
    public ResponseEntity<List<Holiday>> listHolidays() {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        return ResponseEntity.ok(holidayService.listHolidays(tenantId));
    }

    @PostMapping("/import")
    public ResponseEntity<Integer> importHolidays(@RequestParam(required = false) Integer year) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        int targetYear = (year != null) ? year : LocalDate.now().getYear();
        
        int count = holidayService.importHolidays(tenantId, targetYear);
        return ResponseEntity.ok(count);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHoliday(@PathVariable UUID id) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        holidayService.deleteHoliday(tenantId, id);
        return ResponseEntity.noContent().build();
    }
}
