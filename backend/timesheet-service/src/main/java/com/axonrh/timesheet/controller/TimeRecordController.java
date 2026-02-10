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
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@Tag(name = "Timesheet", description = "API de registro de ponto")
public class TimeRecordController {

    private final TimeRecordService timeRecordService;
    private final DailySummaryService dailySummaryService;

    // ==================== Registro de Ponto ====================

    @PostMapping("/records")
    @Operation(summary = "Registrar ponto", description = "Registra entrada, saida ou intervalo")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:CREATE', 'ADMIN')")
    public ResponseEntity<TimeRecordResponse> registerTimeRecord(
            @Valid @RequestBody TimeRecordRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        TimeRecordResponse response = timeRecordService.registerTimeRecord(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/records/quick")
    @Operation(summary = "Registro rapido", description = "Registra automaticamente o proximo tipo de ponto esperado")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:CREATE', 'ADMIN')")
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
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<List<TimeRecordResponse>> getRecordsByPeriod(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal Jwt jwt) {

        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        List<TimeRecordResponse> records = timeRecordService.getRecordsByPeriod(resolvedId, startDate, endDate);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/records/employee/{employeeId}/date/{date}")
    @Operation(summary = "Buscar registros por data", description = "Lista registros de um dia especifico")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<List<TimeRecordResponse>> getRecordsByDate(
            @PathVariable String employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Jwt jwt) {

        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        List<TimeRecordResponse> records = timeRecordService.getRecordsByDate(resolvedId, date);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/records/employee/{employeeId}/last")
    @Operation(summary = "Ultimo registro", description = "Retorna o ultimo registro do colaborador")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<TimeRecordResponse> getLastRecord(
            @PathVariable String employeeId,
            @AuthenticationPrincipal Jwt jwt) {
        
        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        return timeRecordService.getLastRecord(resolvedId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/records/today")
    @Operation(summary = "Registros de hoje", description = "Retorna registros de hoje do colaborador logado")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:CREATE', 'ADMIN')")
    public ResponseEntity<List<TimeRecordResponse>> getTodayRecords(@AuthenticationPrincipal Jwt jwt) {
        UUID employeeId = UUID.fromString(jwt.getSubject());
        List<TimeRecordResponse> records = timeRecordService.getRecordsByDate(employeeId, LocalDate.now());
        return ResponseEntity.ok(records);
    }

    @GetMapping("/records/employee/{employeeId}/next-type")
    @Operation(summary = "Proximo tipo esperado", description = "Retorna o proximo tipo de registro esperado")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:CREATE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getNextExpectedType(
            @PathVariable String employeeId,
            @AuthenticationPrincipal Jwt jwt) {
        
        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        RecordType nextType = timeRecordService.getExpectedNextRecordType(resolvedId);
        return ResponseEntity.ok(Map.of(
                "nextType", nextType,
                "label", getRecordTypeLabel(nextType)
        ));
    }

    // ==================== Aprovacao ====================

    @GetMapping("/records/pending")
    @Operation(summary = "Registros pendentes", description = "Lista registros pendentes de aprovacao")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:UPDATE', 'TIMESHEET:APPROVE', 'ADMIN')")
    public ResponseEntity<Page<TimeRecordResponse>> getPendingRecords(
            Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {
        Page<TimeRecordResponse> records = timeRecordService.getPendingRecords(jwt, pageable);
        return ResponseEntity.ok(records);
    }

    @PostMapping("/records/{recordId}/approve")
    @Operation(summary = "Aprovar registro", description = "Aprova um registro pendente")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:UPDATE', 'TIMESHEET:APPROVE', 'ADMIN')")
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
    @PreAuthorize("hasAnyAuthority('TIMESHEET:UPDATE', 'TIMESHEET:APPROVE', 'ADMIN')")
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
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<Map<String, Long>> countPendingRecords(@AuthenticationPrincipal Jwt jwt) {
        long count = timeRecordService.countPendingRecords(jwt);
        return ResponseEntity.ok(Map.of("count", count));
    }

    // ==================== Espelho de Ponto ====================

    @GetMapping("/timesheet/employee/{employeeId}")
    @Operation(summary = "Espelho de ponto", description = "Retorna espelho de ponto de um periodo")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<List<DailySummaryResponse>> getTimesheet(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal Jwt jwt) {

        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        log.info("Buscando espelho para employeeId resolvido: {} (original: {})", resolvedId, employeeId);
        List<DailySummaryResponse> timesheet = dailySummaryService.getTimesheetByPeriod(resolvedId, startDate, endDate);
        return ResponseEntity.ok(timesheet);
    }

    @GetMapping("/timesheet/employee/{employeeId}/date/{date}")
    @Operation(summary = "Resumo diario", description = "Retorna resumo de um dia especifico")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<DailySummaryResponse> getDailySummary(
            @PathVariable String employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Jwt jwt) {

        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        return dailySummaryService.getDailySummary(resolvedId, date)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/timesheet/employee/{employeeId}/totals")
    @Operation(summary = "Totais do periodo", description = "Retorna totais de horas de um periodo")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<DailySummaryService.PeriodTotals> getPeriodTotals(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal Jwt jwt) {

        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        DailySummaryService.PeriodTotals totals = dailySummaryService.getPeriodTotals(resolvedId, startDate, endDate);
        return ResponseEntity.ok(totals);
    }

    @GetMapping("/statistics")
    @Operation(summary = "Estatisticas", description = "Retorna estatisticas de ponto para o dashboard")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<Map<String, Long>> getStatistics(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Long> stats = timeRecordService.getStatistics(jwt);
        return ResponseEntity.ok(stats);
    }

    private UUID resolveEmployeeId(String employeeId, Jwt jwt) {
        if ("me".equalsIgnoreCase(employeeId)) {
            return UUID.fromString(jwt.getSubject());
        }
        return UUID.fromString(employeeId);
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
