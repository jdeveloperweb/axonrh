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

@RestController
@RequestMapping("/api/v1/timesheet/timesheet")
@RequiredArgsConstructor
@Tag(name = "Timesheet Export", description = "API de exportação de espelho de ponto")
public class TimesheetExportController {

    private final TimesheetExportService exportService;

    @GetMapping("/employee/{employeeId}/export")
    @Operation(summary = "Exportar espelho individual", description = "Gera PDF ou Excel do espelho de ponto de um colaborador")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'ADMIN')")
    public ResponseEntity<byte[]> exportIndividual(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "pdf") String format) {

        byte[] data;
        String filename;
        MediaType mediaType;

        if ("excel".equalsIgnoreCase(format)) {
            data = exportService.exportToExcel(employeeId, startDate, endDate);
            filename = "espelho-ponto-" + employeeId + ".xlsx";
            mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            data = exportService.exportToPdf(employeeId, startDate, endDate);
            filename = "espelho-ponto-" + employeeId + ".pdf";
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
}
