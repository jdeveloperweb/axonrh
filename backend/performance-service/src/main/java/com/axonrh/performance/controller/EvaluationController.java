package com.axonrh.performance.controller;

import com.axonrh.performance.dto.NineBoxMatrix;
import com.axonrh.performance.entity.Evaluation;
import com.axonrh.performance.entity.EvaluationAnswer;
import com.axonrh.performance.entity.EvaluationCycle;
import com.axonrh.performance.service.EvaluationService;
import com.axonrh.performance.service.EvaluationService.EvaluationStatistics;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/performance")
public class EvaluationController {

    private final EvaluationService evaluationService;

    public EvaluationController(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    // ==================== Cycles ====================

    @PostMapping("/cycles")
    public ResponseEntity<EvaluationCycle> createCycle(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody EvaluationCycle cycle) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(evaluationService.createCycle(tenantId, cycle));
    }

    @GetMapping("/cycles")
    public ResponseEntity<List<EvaluationCycle>> listCycles(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(evaluationService.listCycles(tenantId));
    }

    @GetMapping("/cycles/{cycleId}")
    public ResponseEntity<EvaluationCycle> getCycle(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID cycleId) {
        return ResponseEntity.ok(evaluationService.getCycle(tenantId, cycleId));
    }

    @PutMapping("/cycles/{cycleId}")
    public ResponseEntity<EvaluationCycle> updateCycle(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID cycleId,
            @RequestBody EvaluationCycle cycle) {
        return ResponseEntity.ok(evaluationService.updateCycle(tenantId, cycleId, cycle));
    }

    @DeleteMapping("/cycles/{cycleId}")
    public ResponseEntity<Void> deleteCycle(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID cycleId) {
        evaluationService.deleteCycle(tenantId, cycleId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cycles/active")
    public ResponseEntity<List<EvaluationCycle>> getActiveCycles(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(evaluationService.getActiveCycles(tenantId));
    }

    @PostMapping("/cycles/{cycleId}/activate")
    public ResponseEntity<EvaluationCycle> activateCycle(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID cycleId) {
        return ResponseEntity.ok(evaluationService.activateCycle(tenantId, cycleId));
    }

    @PostMapping("/cycles/{cycleId}/complete")
    public ResponseEntity<EvaluationCycle> completeCycle(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID cycleId) {
        return ResponseEntity.ok(evaluationService.completeCycle(tenantId, cycleId));
    }

    @GetMapping("/cycles/{cycleId}/statistics")
    public ResponseEntity<EvaluationStatistics> getCycleStatistics(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID cycleId) {
        return ResponseEntity.ok(evaluationService.getCycleStatistics(tenantId, cycleId));
    }

    // ==================== Evaluations ====================

    @PostMapping("/evaluations")
    public ResponseEntity<Evaluation> createEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody Evaluation evaluation) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(evaluationService.createEvaluation(tenantId, evaluation));
    }

    @GetMapping("/evaluations/{evaluationId}")
    public ResponseEntity<Evaluation> getEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID evaluationId) {
        return ResponseEntity.ok(evaluationService.getEvaluation(tenantId, evaluationId));
    }

    @GetMapping("/evaluations/pending")
    public ResponseEntity<List<Evaluation>> getMyPendingEvaluations(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam UUID evaluatorId) {
        return ResponseEntity.ok(evaluationService.getMyPendingEvaluations(tenantId, evaluatorId));
    }

    @GetMapping("/evaluations/employee/{employeeId}")
    public ResponseEntity<List<Evaluation>> getEmployeeEvaluations(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(evaluationService.getMyEvaluationsAsEmployee(tenantId, employeeId));
    }

    @GetMapping("/cycles/{cycleId}/evaluations")
    public ResponseEntity<Page<Evaluation>> getCycleEvaluations(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID cycleId,
            Pageable pageable) {
        return ResponseEntity.ok(evaluationService.getEvaluationsByCycle(tenantId, cycleId, pageable));
    }

    @PostMapping("/evaluations/{evaluationId}/start")
    public ResponseEntity<Evaluation> startEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID evaluationId) {
        return ResponseEntity.ok(evaluationService.startEvaluation(tenantId, evaluationId));
    }

    @PutMapping("/evaluations/{evaluationId}/answers")
    public ResponseEntity<Evaluation> saveAnswers(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID evaluationId,
            @RequestBody List<EvaluationAnswer> answers) {
        return ResponseEntity.ok(evaluationService.saveAnswers(tenantId, evaluationId, answers));
    }

    @PostMapping("/evaluations/{evaluationId}/submit")
    public ResponseEntity<Evaluation> submitEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID evaluationId,
            @RequestBody SubmitRequest request) {
        return ResponseEntity.ok(evaluationService.submitEvaluation(
                tenantId, evaluationId,
                request.feedback(), request.strengths(), request.improvements()));
    }

    @PostMapping("/evaluations/{evaluationId}/calibrate")
    public ResponseEntity<Evaluation> calibrateEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID evaluationId,
            @RequestBody CalibrateRequest request) {
        return ResponseEntity.ok(evaluationService.calibrateEvaluation(
                tenantId, evaluationId, request.newScore(), request.notes()));
    }

    @PostMapping("/evaluations/{evaluationId}/complete")
    public ResponseEntity<Evaluation> completeEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID evaluationId) {
        return ResponseEntity.ok(evaluationService.completeEvaluation(tenantId, evaluationId));
    }

    @PostMapping("/evaluations/{evaluationId}/acknowledge")
    public ResponseEntity<Evaluation> acknowledgeEvaluation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID evaluationId,
            @RequestBody AcknowledgeRequest request) {
        return ResponseEntity.ok(evaluationService.acknowledgeEvaluation(
                tenantId, evaluationId, request.comments()));
    }

    @GetMapping("/evaluations/overdue")
    public ResponseEntity<List<Evaluation>> getOverdueEvaluations(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(evaluationService.getOverdueEvaluations(tenantId));
    }

    // ==================== 9Box ====================

    @GetMapping("/cycles/{cycleId}/ninebox")
    public ResponseEntity<NineBoxMatrix> getNineBoxMatrix(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID cycleId) {
        return ResponseEntity.ok(evaluationService.generateNineBoxMatrix(tenantId, cycleId));
    }

    // ==================== DTOs ====================

    record SubmitRequest(String feedback, String strengths, String improvements) {}
    record CalibrateRequest(BigDecimal newScore, String notes) {}
    record AcknowledgeRequest(String comments) {}
}
