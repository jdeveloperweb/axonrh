package com.axonrh.vacation.controller;

import com.axonrh.vacation.dto.VacationPeriodResponse;
import com.axonrh.vacation.dto.VacationSimulationRequest;
import com.axonrh.vacation.dto.VacationSimulationResponse;
import com.axonrh.vacation.service.VacationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/vacations/periods")
@RequiredArgsConstructor
public class VacationPeriodController {

    private final VacationService service;

    @GetMapping("/my-periods")
    public ResponseEntity<List<VacationPeriodResponse>> getMyPeriods(@AuthenticationPrincipal Jwt jwt) {
        UUID employeeId = service.resolveEmployeeId(getUserId(jwt));
        return ResponseEntity.ok(service.getEmployeePeriods(employeeId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<VacationPeriodResponse>> getEmployeePeriods(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(service.getEmployeePeriods(employeeId));
    }

    @GetMapping("/expiring")
    public ResponseEntity<List<VacationPeriodResponse>> getExpiringPeriods(
            @RequestParam(defaultValue = "60") int daysThreshold) {
        return ResponseEntity.ok(service.getExpiringPeriods(daysThreshold));
    }

    @PostMapping("/simulate")
    public ResponseEntity<VacationSimulationResponse> simulate(@RequestBody VacationSimulationRequest request) {
        return ResponseEntity.ok(service.simulate(request));
    }

    @PostMapping("/sync")
    public ResponseEntity<Void> syncPeriods() {
        service.syncPeriods();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/notify")
    public ResponseEntity<Void> notifyExpiration(@PathVariable UUID id) {
        service.sendPeriodExpirationNotification(id);
        return ResponseEntity.ok().build();
    }

    // --- Helpers ---

    private UUID getUserId(Jwt jwt) {
        if (jwt == null) return UUID.fromString("00000000-0000-0000-0000-000000000000");
        return UUID.fromString(jwt.getSubject());
    }
}
