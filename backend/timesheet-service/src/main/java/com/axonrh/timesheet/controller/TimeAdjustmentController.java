package com.axonrh.timesheet.controller;

import com.axonrh.timesheet.dto.TimeAdjustmentRequest;
import com.axonrh.timesheet.dto.TimeAdjustmentResponse;
import com.axonrh.timesheet.service.TimeAdjustmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * T143 - Controller de ajuste de ponto.
 */
@RestController
@RequestMapping("/api/v1/timesheet/adjustments")
@RequiredArgsConstructor
@Tag(name = "Time Adjustments", description = "API de ajuste de ponto")
public class TimeAdjustmentController {

    private final TimeAdjustmentService adjustmentService;

    @PostMapping
    @Operation(summary = "Solicitar ajuste", description = "Cria uma solicitacao de ajuste de ponto")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:CREATE', 'ADMIN')")
    public ResponseEntity<TimeAdjustmentResponse> createAdjustment(
            @Valid @RequestBody TimeAdjustmentRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID employeeId = UUID.fromString(jwt.getSubject());
        String employeeName = jwt.getClaimAsString("name");

        TimeAdjustmentResponse response = adjustmentService.createAdjustment(request, employeeId, employeeName);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/pending")
    @Operation(summary = "Ajustes pendentes", description = "Lista ajustes pendentes de aprovacao")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:UPDATE', 'TIMESHEET:APPROVE', 'ADMIN')")
    public ResponseEntity<Page<TimeAdjustmentResponse>> getPendingAdjustments(Pageable pageable) {
        Page<TimeAdjustmentResponse> adjustments = adjustmentService.getPendingAdjustments(pageable);
        return ResponseEntity.ok(adjustments);
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Ajustes do colaborador", description = "Lista ajustes de um colaborador")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<Page<TimeAdjustmentResponse>> getEmployeeAdjustments(
            @PathVariable UUID employeeId,
            Pageable pageable) {

        Page<TimeAdjustmentResponse> adjustments = adjustmentService.getEmployeeAdjustments(employeeId, pageable);
        return ResponseEntity.ok(adjustments);
    }

    @PostMapping("/{adjustmentId}/approve")
    @Operation(summary = "Aprovar ajuste", description = "Aprova uma solicitacao de ajuste")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:UPDATE', 'TIMESHEET:APPROVE', 'ADMIN')")
    public ResponseEntity<TimeAdjustmentResponse> approveAdjustment(
            @PathVariable UUID adjustmentId,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal Jwt jwt) {

        UUID approverId = UUID.fromString(jwt.getSubject());
        String approverName = jwt.getClaimAsString("name");

        TimeAdjustmentResponse response = adjustmentService.approveAdjustment(
                adjustmentId, notes, approverId, approverName);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{adjustmentId}/reject")
    @Operation(summary = "Rejeitar ajuste", description = "Rejeita uma solicitacao de ajuste")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:UPDATE', 'TIMESHEET:APPROVE', 'ADMIN')")
    public ResponseEntity<TimeAdjustmentResponse> rejectAdjustment(
            @PathVariable UUID adjustmentId,
            @RequestParam String reason,
            @AuthenticationPrincipal Jwt jwt) {

        UUID approverId = UUID.fromString(jwt.getSubject());
        String approverName = jwt.getClaimAsString("name");

        TimeAdjustmentResponse response = adjustmentService.rejectAdjustment(
                adjustmentId, reason, approverId, approverName);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{adjustmentId}/cancel")
    @Operation(summary = "Cancelar ajuste", description = "Cancela uma solicitacao de ajuste (pelo solicitante)")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:CREATE', 'ADMIN')")
    public ResponseEntity<TimeAdjustmentResponse> cancelAdjustment(
            @PathVariable UUID adjustmentId,
            @AuthenticationPrincipal Jwt jwt) {

        UUID employeeId = UUID.fromString(jwt.getSubject());
        TimeAdjustmentResponse response = adjustmentService.cancelAdjustment(adjustmentId, employeeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending/count")
    @Operation(summary = "Contagem de pendentes", description = "Retorna quantidade de ajustes pendentes")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<Map<String, Long>> countPendingAdjustments() {
        long count = adjustmentService.countPendingAdjustments();
        return ResponseEntity.ok(Map.of("count", count));
    }
}
