package com.axonrh.performance.controller;

import com.axonrh.performance.entity.Goal;
import com.axonrh.performance.entity.enums.GoalStatus;
import com.axonrh.performance.service.GoalService;
import com.axonrh.performance.service.GoalService.GoalStatistics;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/performance/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    // ==================== CRUD ====================

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:CREATE')")
    public ResponseEntity<Goal> createGoal(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody Goal goal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(goalService.createGoal(tenantId, goal));
    }

    @GetMapping("/{goalId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:READ')")
    public ResponseEntity<Goal> getGoal(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID goalId) {
        return ResponseEntity.ok(goalService.getGoal(tenantId, goalId));
    }

    @PutMapping("/{goalId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:UPDATE')")
    public ResponseEntity<Goal> updateGoal(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID goalId,
            @RequestBody Goal goal) {
        return ResponseEntity.ok(goalService.updateGoal(tenantId, goalId, goal));
    }

    @DeleteMapping("/{goalId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:DELETE')")
    public ResponseEntity<Void> deleteGoal(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID goalId) {
        goalService.deleteGoal(tenantId, goalId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Listing ====================

    @GetMapping("/employee/{employeeId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:READ')")
    public ResponseEntity<List<Goal>> getEmployeeGoals(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(goalService.getEmployeeGoals(tenantId, employeeId));
    }

    @GetMapping("/department/{departmentId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:READ')")
    public ResponseEntity<List<Goal>> getDepartmentGoals(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID departmentId) {
        return ResponseEntity.ok(goalService.getDepartmentGoals(tenantId, departmentId));
    }

    @GetMapping("/cycle/{cycleId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:READ')")
    public ResponseEntity<Page<Goal>> getCycleGoals(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID cycleId,
            Pageable pageable) {
        return ResponseEntity.ok(goalService.getCycleGoals(tenantId, cycleId, pageable));
    }

    @GetMapping("/employee/{employeeId}/status/{status}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:READ')")
    public ResponseEntity<List<Goal>> getGoalsByStatus(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId,
            @PathVariable GoalStatus status) {
        return ResponseEntity.ok(goalService.getGoalsByStatus(tenantId, employeeId, status));
    }

    @GetMapping("/overdue")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:READ')")
    public ResponseEntity<List<Goal>> getOverdueGoals(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(goalService.getOverdueGoals(tenantId));
    }

    @GetMapping("/at-risk")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:READ')")
    public ResponseEntity<List<Goal>> getAtRiskGoals(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(goalService.getAtRiskGoals(tenantId));
    }

    // ==================== OKRs ====================

    @GetMapping("/{goalId}/key-results")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:READ')")
    public ResponseEntity<List<Goal>> getKeyResults(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID goalId) {
        return ResponseEntity.ok(goalService.getKeyResults(tenantId, goalId));
    }

    @PostMapping("/{goalId}/key-results")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:CREATE')")
    public ResponseEntity<Goal> createKeyResult(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID goalId,
            @RequestBody Goal keyResult) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(goalService.createKeyResult(tenantId, goalId, keyResult));
    }

    @GetMapping("/company-okrs/{cycleId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:READ')")
    public ResponseEntity<List<Goal>> getCompanyOKRs(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID cycleId) {
        return ResponseEntity.ok(goalService.getCompanyOKRs(tenantId, cycleId));
    }

    // ==================== Progress ====================

    @PostMapping("/{goalId}/progress")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:UPDATE')")
    public ResponseEntity<Goal> updateProgress(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID goalId,
            @RequestBody ProgressRequest request) {
        return ResponseEntity.ok(goalService.updateProgress(
                tenantId, goalId, request.newValue(), request.notes(), request.updatedBy()));
    }

    @PostMapping("/{goalId}/complete")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:UPDATE')")
    public ResponseEntity<Goal> completeGoal(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID goalId) {
        return ResponseEntity.ok(goalService.completeGoal(tenantId, goalId));
    }

    @PostMapping("/{goalId}/cancel")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:UPDATE')")
    public ResponseEntity<Goal> cancelGoal(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID goalId) {
        return ResponseEntity.ok(goalService.cancelGoal(tenantId, goalId));
    }

    @PostMapping("/{goalId}/at-risk")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:UPDATE')")
    public ResponseEntity<Goal> markAtRisk(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID goalId) {
        return ResponseEntity.ok(goalService.markAtRisk(tenantId, goalId));
    }

    // ==================== Statistics ====================

    @GetMapping("/employee/{employeeId}/statistics")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('PERFORMANCE:READ')")
    public ResponseEntity<GoalStatistics> getEmployeeStatistics(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(goalService.getEmployeeStatistics(tenantId, employeeId));
    }

    // ==================== DTOs ====================

    record ProgressRequest(BigDecimal newValue, String notes, UUID updatedBy) {}
}
