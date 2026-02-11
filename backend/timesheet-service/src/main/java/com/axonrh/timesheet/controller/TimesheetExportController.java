package com.axonrh.timesheet.controller;

import com.axonrh.timesheet.service.TimesheetExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/v1/timesheet/timesheet")
@RequiredArgsConstructor
@Tag(name = "Timesheet Export", description = "API de exportação de espelho de ponto")
public class TimesheetExportController {

    private final TimesheetExportService exportService;
    private final com.axonrh.timesheet.client.EmployeeServiceClient employeeClient;
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TimesheetExportController.class);

    @GetMapping("/employee/{employeeId}/export")
    @Operation(summary = "Exportar espelho individual", description = "Gera PDF ou Excel do espelho de ponto de um colaborador")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'ADMIN')")
    public ResponseEntity<byte[]> exportIndividual(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "pdf") String format,
            @AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt) {

        java.util.UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        byte[] data;
        String filename;
        MediaType mediaType;

        if ("excel".equalsIgnoreCase(format)) {
            data = exportService.exportToExcel(resolvedId, startDate, endDate);
            filename = "espelho-ponto-" + resolvedId + ".xlsx";
            mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            data = exportService.exportToPdf(resolvedId, startDate, endDate);
            filename = "espelho-ponto-" + resolvedId + ".pdf";
            mediaType = MediaType.APPLICATION_PDF;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(data);
    }

    @GetMapping("/export/mass")
    @Operation(summary = "Exportar espelho em massa", description = "Gera um único PDF com o espelho de ponto de todos os colaboradores")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'RH', 'GESTOR_RH', 'ANALISTA_DP')")
    public ResponseEntity<byte[]> exportMass(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        byte[] data = exportService.exportMassToPdf(startDate, endDate);
        String filename = "espelho-ponto-massa.pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    private java.util.UUID resolveEmployeeId(String employeeId, org.springframework.security.oauth2.jwt.Jwt jwt) {
        if ("me".equalsIgnoreCase(employeeId)) {
            java.util.UUID userId = java.util.UUID.fromString(jwt.getSubject());
            try {
                String email = jwt.getClaimAsString("email");
                com.axonrh.timesheet.dto.EmployeeDTO employee = employeeClient.getEmployeeByUserId(userId, email);
                if (employee != null) {
                    log.debug("Resolvido usuario {} para funcionario {} para exportacao", userId, employee.getId());
                    return employee.getId();
                }
            } catch (Exception e) {
                log.error("Erro ao resolver funcionario para usuario {} na exportacao: {}", userId, e.getMessage());
            }
            return userId;
        }
        return java.util.UUID.fromString(employeeId);
    }
}
