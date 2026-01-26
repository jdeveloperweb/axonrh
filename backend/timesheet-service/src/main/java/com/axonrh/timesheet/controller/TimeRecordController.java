package com.axonrh.timesheet.controller;

import com.axonrh.timesheet.dto.DailySummaryResponse;
import com.axonrh.timesheet.dto.TimeRecordRequest;
import com.axonrh.timesheet.dto.TimeRecordResponse;
import com.axonrh.timesheet.entity.enums.RecordType;
import com.axonrh.timesheet.service.DailySummaryService;
import com.axonrh.timesheet.service.TimeRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * T132-T133 - Controller de registro de ponto.
 */
@RestController
@RequestMapping("/api/v1/timesheet")
@RequiredArgsConstructor
@Tag(name = "Timesheet", description = "API de registro de ponto")
public class TimeRecordController {

    private final TimeRecordService timeRecordService;
    private final DailySummaryService dailySummaryService;

    // ==================== Registro de Ponto ====================

    @PostMapping("/records")
    @Operation(summary = "Registrar ponto", description = "Registra entrada, saida ou intervalo")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_RECORD', 'ADMIN')")
    public ResponseEntity<TimeRecordResponse> registerTimeRecord(
            @Valid @RequestBody TimeRecordRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        TimeRecordResponse response = timeRecordService.registerTimeRecord(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/records/quick")
    @Operation(summary = "Registro rapido", description = "Registra automaticamente o proximo tipo de ponto esperado")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_RECORD', 'ADMIN')")
    public ResponseEntity<TimeRecordResponse> quickRecord(
            @RequestParam UUID employeeId,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) String deviceId,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());

        // Determinar proximo tipo de registro
        RecordType nextType = timeRecordService.getExpectedNextRecordType(employeeId);

        TimeRecordRequest request = TimeRecordRequest.builder()
                .employeeId(employeeId)
                .recordType(nextType)
                .source(com.axonrh.timesheet.entity.enums.RecordSource.WEB)
                .latitude(latitude)
                .longitude(longitude)
                .deviceId(deviceId)
                .build();

        TimeRecordResponse response = timeRecordService.registerTimeRecord(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/records/employee/{employeeId}")
    @Operation(summary = "Buscar registros por periodo", description = "Lista registros de ponto de um colaborador")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_VIEW', 'TIMESHEET_MANAGE', 'ADMIN')")
    public ResponseEntity<List<TimeRecordResponse>> getRecordsByPeriod(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<TimeRecordResponse> records = timeRecordService.getRecordsByPeriod(employeeId, startDate, endDate);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/records/employee/{employeeId}/date/{date}")
    @Operation(summary = "Buscar registros por data", description = "Lista registros de um dia especifico")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_VIEW', 'TIMESHEET_MANAGE', 'ADMIN')")
    public ResponseEntity<List<TimeRecordResponse>> getRecordsByDate(
            @PathVariable UUID employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<TimeRecordResponse> records = timeRecordService.getRecordsByDate(employeeId, date);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/records/employee/{employeeId}/last")
    @Operation(summary = "Ultimo registro", description = "Retorna o ultimo registro do colaborador")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_VIEW', 'TIMESHEET_MANAGE', 'ADMIN')")
    public ResponseEntity<TimeRecordResponse> getLastRecord(@PathVariable UUID employeeId) {
        return timeRecordService.getLastRecord(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/records/employee/{employeeId}/next-type")
    @Operation(summary = "Proximo tipo esperado", description = "Retorna o proximo tipo de registro esperado")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_VIEW', 'TIMESHEET_RECORD', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getNextExpectedType(@PathVariable UUID employeeId) {
        RecordType nextType = timeRecordService.getExpectedNextRecordType(employeeId);
        return ResponseEntity.ok(Map.of(
                "nextType", nextType,
                "label", getRecordTypeLabel(nextType)
        ));
    }

    // ==================== Aprovacao ====================

    @GetMapping("/records/pending")
    @Operation(summary = "Registros pendentes", description = "Lista registros pendentes de aprovacao")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_MANAGE', 'ADMIN')")
    public ResponseEntity<Page<TimeRecordResponse>> getPendingRecords(Pageable pageable) {
        Page<TimeRecordResponse> records = timeRecordService.getPendingRecords(pageable);
        return ResponseEntity.ok(records);
    }

    @PostMapping("/records/{recordId}/approve")
    @Operation(summary = "Aprovar registro", description = "Aprova um registro pendente")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_MANAGE', 'ADMIN')")
    public ResponseEntity<TimeRecordResponse> approveRecord(
            @PathVariable UUID recordId,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal Jwt jwt) {

        UUID approverId = UUID.fromString(jwt.getSubject());
        TimeRecordResponse response = timeRecordService.approveRecord(recordId, notes, approverId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/records/{recordId}/reject")
    @Operation(summary = "Rejeitar registro", description = "Rejeita um registro pendente")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_MANAGE', 'ADMIN')")
    public ResponseEntity<TimeRecordResponse> rejectRecord(
            @PathVariable UUID recordId,
            @RequestParam String reason,
            @AuthenticationPrincipal Jwt jwt) {

        UUID approverId = UUID.fromString(jwt.getSubject());
        TimeRecordResponse response = timeRecordService.rejectRecord(recordId, reason, approverId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/records/pending/count")
    @Operation(summary = "Contagem de pendentes", description = "Retorna quantidade de registros pendentes")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_VIEW', 'TIMESHEET_MANAGE', 'ADMIN')")
    public ResponseEntity<Map<String, Long>> countPendingRecords() {
        long count = timeRecordService.countPendingRecords();
        return ResponseEntity.ok(Map.of("count", count));
    }

    // ==================== Espelho de Ponto ====================

    @GetMapping("/timesheet/employee/{employeeId}")
    @Operation(summary = "Espelho de ponto", description = "Retorna espelho de ponto de um periodo")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_VIEW', 'TIMESHEET_MANAGE', 'ADMIN')")
    public ResponseEntity<List<DailySummaryResponse>> getTimesheet(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<DailySummaryResponse> timesheet = dailySummaryService.getTimesheetByPeriod(employeeId, startDate, endDate);
        return ResponseEntity.ok(timesheet);
    }

    @GetMapping("/timesheet/employee/{employeeId}/date/{date}")
    @Operation(summary = "Resumo diario", description = "Retorna resumo de um dia especifico")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_VIEW', 'TIMESHEET_MANAGE', 'ADMIN')")
    public ResponseEntity<DailySummaryResponse> getDailySummary(
            @PathVariable UUID employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return dailySummaryService.getDailySummary(employeeId, date)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/timesheet/employee/{employeeId}/totals")
    @Operation(summary = "Totais do periodo", description = "Retorna totais de horas de um periodo")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_VIEW', 'TIMESHEET_MANAGE', 'ADMIN')")
    public ResponseEntity<DailySummaryService.PeriodTotals> getPeriodTotals(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        DailySummaryService.PeriodTotals totals = dailySummaryService.getPeriodTotals(employeeId, startDate, endDate);
        return ResponseEntity.ok(totals);
    }

    private String getRecordTypeLabel(RecordType type) {
        return switch (type) {
            case ENTRY -> "Entrada";
            case EXIT -> "Saida";
            case BREAK_START -> "Inicio Intervalo";
            case BREAK_END -> "Fim Intervalo";
        };
    }
}
