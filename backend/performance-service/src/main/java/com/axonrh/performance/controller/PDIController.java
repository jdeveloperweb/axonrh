package com.axonrh.performance.controller;

import com.axonrh.performance.entity.PDI;
import com.axonrh.performance.entity.PDIAction;
import com.axonrh.performance.service.PDIService;
import com.axonrh.performance.service.PDIService.PDIStatistics;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/performance/pdis")
public class PDIController {

    private final PDIService pdiService;

    public PDIController(PDIService pdiService) {
        this.pdiService = pdiService;
    }

    // ==================== CRUD ====================

    @PostMapping
    public ResponseEntity<PDI> createPDI(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody PDI pdi) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pdiService.createPDI(tenantId, pdi));
    }

    @GetMapping("/{pdiId}")
    public ResponseEntity<PDI> getPDI(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId) {
        return ResponseEntity.ok(pdiService.getPDI(tenantId, pdiId));
    }

    @PutMapping("/{pdiId}")
    public ResponseEntity<PDI> updatePDI(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId,
            @RequestBody PDI pdi) {
        return ResponseEntity.ok(pdiService.updatePDI(tenantId, pdiId, pdi));
    }

    @DeleteMapping("/{pdiId}")
    public ResponseEntity<Void> deletePDI(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId) {
        pdiService.deletePDI(tenantId, pdiId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Listing ====================

    @GetMapping
    public ResponseEntity<Page<PDI>> getAllPDIs(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(pdiService.getAllPDIs(tenantId, pageable));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PDI>> getEmployeePDIs(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(pdiService.getEmployeePDIs(tenantId, employeeId));
    }

    @GetMapping("/employee/{employeeId}/active")
    public ResponseEntity<List<PDI>> getActivePDIs(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(pdiService.getActivePDIs(tenantId, employeeId));
    }

    @GetMapping("/team/{managerId}")
    public ResponseEntity<List<PDI>> getTeamPDIs(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID managerId) {
        return ResponseEntity.ok(pdiService.getTeamPDIs(tenantId, managerId));
    }

    @GetMapping("/pending-approval/{managerId}")
    public ResponseEntity<List<PDI>> getPendingApprovalPDIs(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID managerId) {
        return ResponseEntity.ok(pdiService.getPendingApprovalPDIs(tenantId, managerId));
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<PDI>> getOverduePDIs(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(pdiService.getOverduePDIs(tenantId));
    }

    // ==================== Workflow ====================

    @PostMapping("/{pdiId}/submit")
    public ResponseEntity<PDI> submitForApproval(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId) {
        return ResponseEntity.ok(pdiService.submitForApproval(tenantId, pdiId));
    }

    @PostMapping("/{pdiId}/approve")
    public ResponseEntity<PDI> approvePDI(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId,
            @RequestParam UUID approverId) {
        return ResponseEntity.ok(pdiService.approvePDI(tenantId, pdiId, approverId));
    }

    @PostMapping("/{pdiId}/activate")
    public ResponseEntity<PDI> activatePDI(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId) {
        return ResponseEntity.ok(pdiService.activatePDI(tenantId, pdiId));
    }

    @PostMapping("/{pdiId}/complete")
    public ResponseEntity<PDI> completePDI(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId) {
        return ResponseEntity.ok(pdiService.completePDI(tenantId, pdiId));
    }

    @PostMapping("/{pdiId}/cancel")
    public ResponseEntity<PDI> cancelPDI(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId) {
        return ResponseEntity.ok(pdiService.cancelPDI(tenantId, pdiId));
    }

    // ==================== Actions ====================

    @PostMapping("/{pdiId}/actions")
    public ResponseEntity<PDI> addAction(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId,
            @RequestBody PDIAction action) {
        return ResponseEntity.ok(pdiService.addAction(tenantId, pdiId, action));
    }

    @DeleteMapping("/{pdiId}/actions/{actionId}")
    public ResponseEntity<PDI> removeAction(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId,
            @PathVariable UUID actionId) {
        return ResponseEntity.ok(pdiService.removeAction(tenantId, pdiId, actionId));
    }

    @PostMapping("/{pdiId}/actions/{actionId}/start")
    public ResponseEntity<PDI> startAction(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId,
            @PathVariable UUID actionId) {
        return ResponseEntity.ok(pdiService.startAction(tenantId, pdiId, actionId));
    }

    @PostMapping("/{pdiId}/actions/{actionId}/complete")
    public ResponseEntity<PDI> completeAction(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId,
            @PathVariable UUID actionId,
            @RequestBody CompleteActionRequest request) {
        return ResponseEntity.ok(pdiService.completeAction(
                tenantId, pdiId, actionId, request.notes(), request.hoursSpent()));
    }

    @PostMapping("/{pdiId}/actions/{actionId}/progress")
    public ResponseEntity<PDI> updateActionProgress(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID pdiId,
            @PathVariable UUID actionId,
            @RequestBody UpdateProgressRequest request) {
        return ResponseEntity.ok(pdiService.updateActionProgress(
                tenantId, pdiId, actionId, request.progress()));
    }


    // ==================== From Evaluation ====================

    @PostMapping("/from-evaluation")
    public ResponseEntity<PDI> createFromEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody CreateFromEvaluationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pdiService.createFromEvaluation(
                        tenantId, request.evaluationId(),
                        request.employeeId(), request.employeeName(),
                        request.managerId(), request.managerName(),
                        request.focusAreas()));
    }

    // ==================== Statistics ====================

    @GetMapping("/manager/{managerId}/statistics")
    public ResponseEntity<PDIStatistics> getManagerStatistics(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID managerId) {
        return ResponseEntity.ok(pdiService.getManagerStatistics(tenantId, managerId));
    }

    // ==================== DTOs ====================

    record CompleteActionRequest(String notes, Integer hoursSpent) {}

    record UpdateProgressRequest(Integer progress) {}

    record CreateFromEvaluationRequest(
            UUID evaluationId,
            UUID employeeId,
            String employeeName,
            UUID managerId,
            String managerName,
            String focusAreas
    ) {}
}
