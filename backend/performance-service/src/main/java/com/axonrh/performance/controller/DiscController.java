package com.axonrh.performance.controller;

import com.axonrh.performance.dto.DiscAssignmentDTO;
import com.axonrh.performance.dto.DiscEvaluationDTO;
import com.axonrh.performance.dto.DiscQuestionDTO;
import com.axonrh.performance.dto.DiscStatisticsDTO;
import com.axonrh.performance.entity.enums.DiscAssessmentStatus;
import com.axonrh.performance.service.DiscService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/performance/disc")
public class DiscController {

    private final DiscService discService;

    public DiscController(DiscService discService) {
        this.discService = discService;
    }

    // ==================== Questions ====================

    @GetMapping("/questions")
    public ResponseEntity<List<DiscQuestionDTO>> getQuestions(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(discService.getQuestions(tenantId));
    }

    @GetMapping("/questionnaire/{questionnaireId}/questions")
    public ResponseEntity<List<DiscQuestionDTO>> getQuestionsByQuestionnaire(
            @PathVariable UUID questionnaireId) {
        return ResponseEntity.ok(discService.getQuestionsByQuestionnaireId(questionnaireId));
    }

    // ==================== Evaluations ====================

    @GetMapping("/employee/{employeeId}/latest")
    public ResponseEntity<DiscEvaluationDTO> getLatestEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {
        DiscEvaluationDTO evaluation = discService.getLatestEvaluation(tenantId, employeeId);
        if (evaluation == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(evaluation);
    }

    @GetMapping("/employee/{employeeId}/history")
    public ResponseEntity<List<DiscEvaluationDTO>> getEmployeeHistory(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(discService.getEmployeeHistory(tenantId, employeeId));
    }

    @GetMapping("/employee/{employeeId}/pending")
    public ResponseEntity<List<DiscAssignmentDTO>> getPendingForEmployee(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(discService.getPendingForEmployee(tenantId, employeeId));
    }

    @GetMapping("/{evaluationId}")
    public ResponseEntity<DiscEvaluationDTO> getEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID evaluationId) {
        return ResponseEntity.ok(discService.getEvaluation(tenantId, evaluationId));
    }

    @GetMapping
    public ResponseEntity<Page<DiscEvaluationDTO>> listEvaluations(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(required = false) DiscAssessmentStatus status,
            Pageable pageable) {
        if (status != null) {
            return ResponseEntity.ok(discService.listEvaluationsByStatus(tenantId, status, pageable));
        }
        return ResponseEntity.ok(discService.listEvaluations(tenantId, pageable));
    }

    @PostMapping
    public ResponseEntity<DiscEvaluationDTO> submitEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody SubmitEvaluationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(discService.submitEvaluation(
                tenantId,
                request.employeeId(),
                request.employeeName(),
                request.answers()
            ));
    }

    @PostMapping("/{evaluationId}/start")
    public ResponseEntity<DiscEvaluationDTO> startEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID evaluationId) {
        return ResponseEntity.ok(discService.startEvaluation(tenantId, evaluationId));
    }

    @DeleteMapping("/{evaluationId}")
    public ResponseEntity<Void> deleteEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID evaluationId) {
        discService.deleteEvaluation(tenantId, evaluationId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Assignments ====================

    @PostMapping("/assign")
    public ResponseEntity<DiscAssignmentDTO> assignEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody AssignEvaluationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(discService.assignEvaluation(
                tenantId,
                request.employeeId(),
                request.employeeName(),
                request.assignedBy(),
                request.assignedByName(),
                request.dueDate()
            ));
    }

    @PostMapping("/assign/bulk")
    public ResponseEntity<List<DiscAssignmentDTO>> assignBulk(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody BulkAssignRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(discService.assignBulk(
                tenantId,
                request.employeeIds(),
                request.employeeNames(),
                request.assignedBy(),
                request.assignedByName(),
                request.dueDate()
            ));
    }

    @DeleteMapping("/assignment/{assignmentId}")
    public ResponseEntity<Void> cancelAssignment(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID assignmentId) {
        discService.cancelAssignment(tenantId, assignmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assignments")
    public ResponseEntity<Page<DiscAssignmentDTO>> listAssignments(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(required = false) Boolean pendingOnly,
            Pageable pageable) {
        if (Boolean.TRUE.equals(pendingOnly)) {
            return ResponseEntity.ok(discService.listPendingAssignments(tenantId, pageable));
        }
        return ResponseEntity.ok(discService.listAssignments(tenantId, pageable));
    }

    // ==================== Statistics ====================

    @GetMapping("/statistics")
    public ResponseEntity<DiscStatisticsDTO> getStatistics(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(discService.getStatistics(tenantId));
    }

    // ==================== Helper endpoints ====================

    @GetMapping("/employee/{employeeId}/has-completed")
    public ResponseEntity<Boolean> hasCompletedEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(discService.hasCompletedEvaluation(tenantId, employeeId));
    }

    @GetMapping("/employee/{employeeId}/has-pending")
    public ResponseEntity<Boolean> hasPendingEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(discService.hasPendingEvaluation(tenantId, employeeId));
    }

    // ==================== DTOs ====================

    record SubmitEvaluationRequest(
        UUID employeeId,
        String employeeName,
        Map<String, String> answers
    ) {}

    record AssignEvaluationRequest(
        UUID employeeId,
        String employeeName,
        UUID assignedBy,
        String assignedByName,
        LocalDate dueDate
    ) {}

    record BulkAssignRequest(
        List<UUID> employeeIds,
        Map<UUID, String> employeeNames,
        UUID assignedBy,
        String assignedByName,
        LocalDate dueDate
    ) {}
}
