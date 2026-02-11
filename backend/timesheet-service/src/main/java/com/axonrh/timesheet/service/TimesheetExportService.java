package com.axonrh.timesheet.service;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.dto.DailySummaryResponse;
import com.axonrh.timesheet.repository.EmployeeScheduleRepository;
import com.axonrh.timesheet.repository.TimeAdjustmentRepository;
import com.itextpdf.html2pdf.HtmlConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Servico de exportacao de espelho de ponto.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TimesheetExportService {

    private final DailySummaryService dailySummaryService;
    private final EmployeeScheduleRepository employeeScheduleRepository;
    private final TimeAdjustmentRepository adjustmentRepository;
    private final com.axonrh.timesheet.client.EmployeeServiceClient employeeClient;
    private final com.axonrh.timesheet.repository.DailySummaryRepository dailySummaryRepository;
    private final com.axonrh.timesheet.client.ConfigServiceClient configServiceClient;

    public byte[] exportToPdf(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        List<DailySummaryResponse> timesheet = dailySummaryService.getTimesheetByPeriod(employeeId, startDate, endDate);
        DailySummaryService.PeriodTotals totals = dailySummaryService.getPeriodTotals(employeeId, startDate, endDate);
        
        String employeeName = getEmployeeName(tenantId, employeeId);
        String html = generateHtmlContent(List.of(new ExportData(employeeId, employeeName, timesheet, totals)), startDate, endDate);
        
        ByteArrayOutputStream target = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(html, target);
        return target.toByteArray();
    }

    public byte[] exportMassToPdf(LocalDate startDate, LocalDate endDate) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        
        // Identificar todos os colaboradores que tiveram atividade (resumos) no período
        List<com.axonrh.timesheet.entity.DailySummary> summaries = dailySummaryRepository
                .findByTenantIdAndSummaryDateBetweenOrderBySummaryDateAsc(tenantId, startDate, endDate);
        
        List<UUID> employeeIds = summaries.stream()
                .map(com.axonrh.timesheet.entity.DailySummary::getEmployeeId)
                .distinct()
                .toList();

        if (employeeIds.isEmpty()) {
            log.warn("Nenhum dado de ponto encontrado para exportacao em massa no periodo {} a {}", startDate, endDate);
            return new byte[0];
        }

        log.info("Iniciando exportacao em massa para {} colaboradores", employeeIds.size());
        
        List<ExportData> exportList = employeeIds.stream().map(id -> {
            try {
                List<DailySummaryResponse> timesheet = dailySummaryService.getTimesheetByPeriod(id, startDate, endDate);
                DailySummaryService.PeriodTotals totals = dailySummaryService.getPeriodTotals(id, startDate, endDate);
                return new ExportData(id, getEmployeeName(tenantId, id), timesheet, totals);
            } catch (Exception e) {
                log.error("Erro ao processar dados do colaborador {} para exportacao em massa: {}", id, e.getMessage());
                return null;
            }
        }).filter(java.util.Objects::nonNull).toList();

        String html = generateHtmlContent(exportList, startDate, endDate);
        
        ByteArrayOutputStream target = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(html, target);
        return target.toByteArray();
    }

    public byte[] exportToExcel(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        List<DailySummaryResponse> timesheet = dailySummaryService.getTimesheetByPeriod(employeeId, startDate, endDate);
        String employeeName = getEmployeeName(tenantId, employeeId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Espelho de Ponto");
            
            // Styles
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Title Info
            Row titleRow = sheet.createRow(0);
            titleRow.createCell(0).setCellValue("EXTRATO DE PONTO - AXONRH");
            
            Row infoRow = sheet.createRow(1);
            infoRow.createCell(0).setCellValue("Colaborador: " + employeeName);
            infoRow.createCell(3).setCellValue("Período: " + startDate + " a " + endDate);

            // Table Header
            Row headerRow = sheet.createRow(3);
            String[] columns = {"Data", "Dia", "Entrada", "I. Início", "I. Fim", "Saída", "Trabalhado", "Extras", "Faltas", "Noturno", "Saldo", "Status"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Data
            int rowIdx = 4;
            for (DailySummaryResponse day : timesheet) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(day.getSummaryDate().toString());
                row.createCell(1).setCellValue(day.getDayOfWeek().substring(0, 3));
                
                if (Boolean.TRUE.equals(day.getIsAbsent())) {
                    row.createCell(2).setCellValue(day.getAbsenceType() != null ? day.getAbsenceType() : "FALTA");
                } else if (Boolean.TRUE.equals(day.getIsHoliday())) {
                    row.createCell(2).setCellValue("FERIADO: " + (day.getHolidayName() != null ? day.getHolidayName() : ""));
                } else {
                    row.createCell(2).setCellValue(formatTimeExcel(day.getFirstEntry()));
                    row.createCell(3).setCellValue(formatTimeExcel(day.getBreakStart()));
                    row.createCell(4).setCellValue(formatTimeExcel(day.getBreakEnd()));
                    row.createCell(5).setCellValue(formatTimeExcel(day.getLastExit()));
                }
                
                row.createCell(6).setCellValue(day.getWorkedFormatted());
                row.createCell(7).setCellValue(day.getOvertimeFormatted());
                row.createCell(8).setCellValue(day.getDeficitFormatted());
                row.createCell(9).setCellValue(day.getNightShiftFormatted());
                row.createCell(10).setCellValue((Boolean.TRUE.equals(day.getIsPositive()) ? "+" : "-") + day.getBalanceFormatted());
                
                // Lógica de Ocorrência melhorada
                String occurrence = "OK";
                if (Boolean.TRUE.equals(day.getIsHoliday())) occurrence = "Feriado";
                else if (Boolean.TRUE.equals(day.getIsAbsent())) occurrence = "Falta";
                else if (day.getDeficitMinutes() != null && day.getDeficitMinutes() > 0) occurrence = "Falta não OK";
                
                row.createCell(11).setCellValue(occurrence);
            }
            
            // Column widths
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar Excel", e);
            return new byte[0];
        }
    }


    private String getEmployeeName(UUID tenantId, UUID employeeId) {
        try {
            com.axonrh.timesheet.dto.EmployeeDTO emp = employeeClient.getEmployee(employeeId);
            if (emp != null) return emp.getFullName();
        } catch (Exception e) {
            log.debug("Nao foi possivel obter nome do colaborador {} via client: {}", employeeId, e.getMessage());
        }

        return adjustmentRepository.findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(
                tenantId, employeeId, org.springframework.data.domain.Pageable.ofSize(1))
                .getContent().stream()
                .map(com.axonrh.timesheet.entity.TimeAdjustment::getEmployeeName)
                .findFirst()
                .orElse("Colaborador (" + employeeId.toString().substring(0, 8) + "...)");
    }

    private record ExportData(UUID id, String name, List<DailySummaryResponse> timesheet, DailySummaryService.PeriodTotals totals) {}

    private String generateHtmlContent(List<ExportData> dataList, LocalDate startDate, LocalDate endDate) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><style>");
        sb.append("body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e293b; margin: 0; padding: 0; background-color: #ffffff; }");
        sb.append(".page { padding: 40px; page-break-after: always; min-height: 1000px; position: relative; }");
        
        // Header
        sb.append(".report-header { border-bottom: 2px solid #2563eb; margin-bottom: 25px; padding-bottom: 15px; display: table; width: 100%; }");
        sb.append(".header-left { display: table-cell; vertical-align: middle; }");
        sb.append(".header-right { display: table-cell; vertical-align: middle; text-align: right; }");
        sb.append("h1 { color: #1e3a8a; font-size: 24px; margin: 0; font-weight: 800; text-transform: uppercase; }");
        sb.append(".company-info { font-size: 12px; color: #64748b; margin-top: 5px; font-weight: 600; }");
        
        // Employee Info Box
        sb.append(".info-grid { width: 100%; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; margin-bottom: 25px; border-collapse: separate; border-spacing: 15px; }");
        sb.append(".info-item { font-size: 13px; color: #334155; }");
        sb.append(".info-label { font-weight: bold; color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }");
        sb.append(".info-value { font-size: 15px; font-weight: 700; color: #0f172a; }");
        
        // Table
        sb.append("table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }");
        sb.append("th { background-color: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 10px; padding: 10px 5px; border-bottom: 2px solid #e2e8f0; text-align: center; }");
        sb.append("td { padding: 8px 4px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #334155; }");
        sb.append("tr:nth-child(even) { background-color: #fafafa; }");
        sb.append(".weekend { background-color: #f8fafc; color: #94a3b8; }");
        sb.append(".holiday { background-color: #fffbeb; color: #92400e; }");
        sb.append(".absent { color: #dc2626; font-weight: 600; font-style: italic; }");
        sb.append(".col-date { font-weight: 600; width: 65px; }");
        sb.append(".col-time { width: 50px; }");
        sb.append(".col-total { font-weight: 600; color: #0f172a; }");
        
        // Summary
        sb.append(".footer-container { display: table; width: 100%; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; }");
        sb.append(".summary-section { display: table-cell; width: 48%; vertical-align: top; }");
        sb.append(".summary-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #ffffff; margin-right: 15px; }");
        sb.append(".summary-title { font-weight: 800; font-size: 12px; color: #1e3a8a; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 10px; text-transform: uppercase; }");
        sb.append(".summary-row { display: table; width: 100%; margin-bottom: 6px; font-size: 12px; }");
        sb.append(".summary-label { display: table-cell; text-align: left; color: #64748b; }");
        sb.append(".summary-value { display: table-cell; text-align: right; font-weight: 700; color: #0f172a; }");
        
        // Signatures
        sb.append(".signature-box { margin-top: 60px; display: table; width: 100%; border-spacing: 40px 0; }");
        sb.append(".sig-line { display: table-cell; border-top: 1px solid #94a3b8; text-align: center; padding-top: 8px; font-size: 11px; color: #475569; width: 45%; }");
        
        // Meta
        sb.append(".page-footer { position: absolute; bottom: 20px; left: 40px; right: 40px; border-top: 1px solid #f1f5f9; padding-top: 10px; font-size: 10px; color: #94a3b8; text-align: center; }");
        
        sb.append("</style></head><body>");

        for (ExportData data : dataList) {
            String logoUrl = null;
            try {
                UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
                com.axonrh.timesheet.client.ConfigServiceClient.LogoUrlResponse logoResp = configServiceClient.getLogoUrl(tenantId);
                if (logoResp != null && logoResp.logoUrl() != null) {
                    // Tentar usar URL do gateway para o renderer de PDF
                    logoUrl = "http://api-gateway:8080" + logoResp.logoUrl();
                }
            } catch (Exception e) {
                log.debug("Nao foi possivel obter logo do tenant: {}", e.getMessage());
            }

            // Buscar horario contratual (escala)
            String workSchedule = "Não definido";
            if (data.timesheet() != null && !data.timesheet().isEmpty()) {
                DailySummaryResponse firstDayWithSchedule = data.timesheet().stream()
                        .filter(d -> d.getScheduledEntry() != null && d.getScheduledExit() != null)
                        .findFirst()
                        .orElse(null);
                
                if (firstDayWithSchedule != null) {
                    workSchedule = formatTime(firstDayWithSchedule.getScheduledEntry()) + " às " + 
                                  formatTime(firstDayWithSchedule.getScheduledExit());
                    if (firstDayWithSchedule.getScheduledBreakStart() != null) {
                        workSchedule += " (Intervalo: " + formatTime(firstDayWithSchedule.getScheduledBreakStart()) + 
                                       " às " + formatTime(firstDayWithSchedule.getScheduledBreakEnd()) + ")";
                    }
                }
            }

            sb.append("<div class='page'>");
            
            // Header Section
            sb.append("<div class='report-header'>");
            sb.append("<div class='header-left'>");
            if (logoUrl != null) {
                sb.append("<img src='").append(logoUrl).append("' style='max-height: 50px; margin-bottom: 10px;' />");
            } else {
                sb.append("<h1 style='color: #2563eb; margin-bottom: 5px;'>AxonRH</h1>");
            }
            sb.append("<h1>Espelho de Ponto</h1><div class='company-info'>Sistema de Gestão de Pessoas</div></div>");
            sb.append("<div class='header-right'><div style='font-size: 12px; font-weight: bold;'>Data de Emissão</div><div style='font-size: 14px;'>")
              .append(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</div></div>");
            sb.append("</div>");

            // Employee & Period Section
            sb.append("<table class='info-grid'><tr>");
            sb.append("<td><div class='info-label'>Colaborador</div><div class='info-value'>").append(data.name()).append("</div></td>");
            sb.append("<td><div class='info-label'>Período de Apuração</div><div class='info-value'>")
              .append(startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
              .append(" a ")
              .append(endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
              .append("</div></td>");
            sb.append("<td><div class='info-label'>Horário</div><div class='info-value'>").append(workSchedule).append("</div></td>");
            sb.append("<td><div class='info-label'>ID Registro</div><div class='info-value'>").append(data.id().toString().substring(0, 8).toUpperCase()).append("</div></td>");
            sb.append("</tr></table>");

            // Main Table
            sb.append("<table><thead><tr>")
                .append("<th class='col-date'>Data</th><th>Dia</th>")
                .append("<th class='col-time'>Entrada</th><th class='col-time'>Intervalo</th>")
                .append("<th class='col-time'>Retorno</th><th class='col-time'>Saída</th>")
                .append("<th class='col-total'>Trabalhado</th><th>Extras</th>")
                .append("<th>Faltas</th><th>Saldo</th>")
                .append("<th>Ocorrência</th>")
                .append("</tr></thead><tbody>");

            for (DailySummaryResponse day : data.timesheet()) {
                String rowClass = "";
                if (Boolean.TRUE.equals(day.getIsHoliday())) rowClass = " class='holiday'";
                else if (day.getDayOfWeek().equals("Sábado") || day.getDayOfWeek().equals("Domingo")) rowClass = " class='weekend'";
                
                sb.append("<tr").append(rowClass).append(">");
                sb.append("<td class='col-date'>").append(day.getSummaryDate().format(DateTimeFormatter.ofPattern("dd/MM/yy"))).append("</td>")
                  .append("<td>").append(day.getDayOfWeek().substring(0, 3)).append("</td>");
                
                if (Boolean.TRUE.equals(day.getIsAbsent())) {
                    sb.append("<td colspan='4' class='absent'>").append(day.getAbsenceType() != null ? day.getAbsenceType().toUpperCase() : "AUSÊNCIA NÃO JUSTIFICADA").append("</td>");
                } else if (Boolean.TRUE.equals(day.getIsHoliday())) {
                    sb.append("<td colspan='4' style='font-style: italic; color: #92400e;'>FERIADO: ").append(day.getHolidayName() != null ? day.getHolidayName() : "").append("</td>");
                } else {
                    sb.append("<td>").append(formatTime(day.getFirstEntry())).append("</td>")
                      .append("<td>").append(formatTime(day.getBreakStart())).append("</td>")
                      .append("<td>").append(formatTime(day.getBreakEnd())).append("</td>")
                      .append("<td>").append(formatTime(day.getLastExit())).append("</td>");
                }

                String occurrence = "OK";
                if (Boolean.TRUE.equals(day.getIsHoliday())) occurrence = "Feriado";
                else if (Boolean.TRUE.equals(day.getIsAbsent())) occurrence = "Falta";
                else if (day.getDeficitMinutes() != null && day.getDeficitMinutes() > 0) occurrence = "Falta não OK";

                sb.append("<td class='col-total'>").append(day.getWorkedFormatted()).append("</td>")
                    .append("<td>").append(day.getOvertimeFormatted()).append("</td>")
                    .append("<td style='color: #dc2626'>").append(day.getDeficitFormatted()).append("</td>")
                    .append("<td style='font-weight: bold;'>").append(Boolean.TRUE.equals(day.getIsPositive()) ? "+" : "-").append(day.getBalanceFormatted()).append("</td>")
                    .append("<td style='font-size: 9px; font-weight: ").append("OK".equals(occurrence) ? "normal" : "bold").append(";'>")
                    .append(occurrence).append("</td>")
                    .append("</tr>");
            }
            sb.append("</tbody></table>");

            // Summary Section
            sb.append("<div class='footer-container'>");
            
            sb.append("<div class='summary-section'><div class='summary-card'>");
            sb.append("<div class='summary-title'>Resumo do Período</div>")
                .append("<div class='summary-row'><span class='summary-label'>Horas Trabalhadas:</span><span class='summary-value'>").append(data.totals().workedFormatted()).append("</span></div>")
                .append("<div class='summary-row'><span class='summary-label'>Horas Extras:</span><span class='summary-value' style='color: #16a34a;'>").append(data.totals().overtimeFormatted()).append("</span></div>")
                .append("<div class='summary-row'><span class='summary-label'>Faltas / Débitos:</span><span class='summary-value' style='color: #dc2626;'>").append(data.totals().deficitFormatted()).append("</span></div>")
                .append("<div class='summary-row'><span class='summary-label'>Adic. Noturno:</span><span class='summary-value'>").append(data.totals().nightShiftFormatted()).append("</span></div>")
                .append("</div></div>");

            sb.append("<div class='summary-section'><div class='summary-card'>");
            sb.append("<div class='summary-title'>Estatísticas</div>")
                .append("<div class='summary-row'><span class='summary-label'>Dias em Falta:</span><span class='summary-value'>").append(data.totals().absences()).append("</span></div>")
                .append("<div class='summary-row'><span class='summary-label'>Atrasos Acumulados:</span><span class='summary-value'>").append(data.totals().lateArrivalFormatted()).append("</span></div>")
                .append("<div class='summary-row'><span class='summary-label'>Total de Ocorrências:</span><span class='summary-value'>").append(data.totals().absences() > 0 ? "Atenção" : "Normal").append("</span></div>")
                .append("</div></div>");
            
            sb.append("</div>");

            // Signatures
            sb.append("<div class='signature-box'>")
                .append("<div class='sig-line'>Assinatura do Colaborador (").append(data.name()).append(")</div>")
                .append("<div class='sig-line'>Assinatura do Responsável / RH</div>")
                .append("</div>");

            sb.append("<div class='page-footer'>Este documento é um espelho de ponto eletrônico gerado pelo sistema AxonRH e serve como comprovante de jornada.</div></div>");
        }

        sb.append("</body></html>");
        return sb.toString();
    }

    private String formatTime(LocalTime val) {
        if (val == null) return "--:--";
        return val.format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private String formatTimeExcel(LocalTime val) {
        if (val == null) return "";
        return val.format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private String getString(String val) {
        return val == null ? "" : val;
    }
}
