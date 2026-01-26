package com.axonrh.ai.controller;

import com.axonrh.ai.service.AiAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AiAnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<AiAnalyticsService.DashboardStats> getDashboardStats(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(defaultValue = "30") int days) {

        AiAnalyticsService.DashboardStats stats = analyticsService.getDashboardStats(tenantId, days);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/response-times")
    public ResponseEntity<AiAnalyticsService.ResponseTimeStats> getResponseTimeStats(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(defaultValue = "30") int days) {

        AiAnalyticsService.ResponseTimeStats stats = analyticsService.getResponseTimeStats(tenantId, days);
        return ResponseEntity.ok(stats);
    }
}
