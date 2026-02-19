package com.axonrh.vacation.controller;

import com.axonrh.vacation.dto.LeaveDashboardDTO;
import com.axonrh.vacation.service.LeaveDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leaves/dashboard")
@RequiredArgsConstructor
public class LeaveDashboardController {

    private final LeaveDashboardService leaveDashboardService;

    @GetMapping
    public ResponseEntity<LeaveDashboardDTO> getDashboard(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(leaveDashboardService.getDashboardData(tenantId));
    }
}
