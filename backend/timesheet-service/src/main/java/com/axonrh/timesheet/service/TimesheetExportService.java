package com.axonrh.timesheet.service;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.dto.DailySummaryResponse;
import com.axonrh.timesheet.repository.EmployeeScheduleRepository;
import com.axonrh.timesheet.repository.TimeAdjustmentRepository;
import com.axonrh.timesheet.client.ConfigServiceClient;
import com.itextpdf.html2pdf.HtmlConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
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
        
        ConfigServiceClient.ThemeConfigResponse theme = null;
        try {
            theme = configServiceClient.getThemeConfig(tenantId);
        } catch (Exception e) {
            log.debug("Erro ao buscar tema para excel: {}", e.getMessage());
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Espelho de Ponto");
            
            // Header Color from Theme
            String primaryHex = (theme != null && theme.getPrimaryColor() != null) ? theme.getPrimaryColor() : "#2563EB";
            Color awtColor;
            try {
                awtColor = Color.decode(primaryHex);
            } catch (Exception e) {
                awtColor = new Color(37, 99, 235); // #2563EB
            }
            XSSFColor xssfColor = new XSSFColor(new byte[]{(byte)awtColor.getRed(), (byte)awtColor.getGreen(), (byte)awtColor.getBlue()}, null);

            // Styles
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            ((XSSFCellStyle)headerStyle).setFillForegroundColor(xssfColor);
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Title Info
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("EXTRATO DE PONTO - AXONRH");
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setColor(xssfColor.getIndex()); // Tentativa de usar cor no texto
            titleFont.setFontHeightInPoints((short) 16);
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);
            
            Row infoRow = sheet.createRow(1);
            infoRow.createCell(0).setCellValue("Colaborador: " + employeeName);
            infoRow.createCell(5).setCellValue("Período: " + startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " a " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

            // Table Header
            Row headerRow = sheet.createRow(3);
            headerRow.setHeightInPoints(25);
            String[] columns = {"Data", "Dia", "Entrada", "I. Início", "I. Fim", "Saída", "Trabalhado", "Extras", "Faltas", "Saldo", "Ocorrência"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Data
            int rowIdx = 4;
            for (DailySummaryResponse day : timesheet) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(day.getSummaryDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
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
                row.createCell(9).setCellValue((Boolean.TRUE.equals(day.getIsPositive()) ? "+" : "-") + day.getBalanceFormatted());
                
                // Lógica de Ocorrência melhorada
                String occurrence = "OK";
                if (Boolean.TRUE.equals(day.getIsHoliday())) occurrence = "Feriado";
                else if (Boolean.TRUE.equals(day.getIsAbsent())) occurrence = "Falta";
                else if (day.getDeficitMinutes() != null && day.getDeficitMinutes() > 0) occurrence = "Falta não OK";
                
                row.createCell(10).setCellValue(occurrence);
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
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        ConfigServiceClient.ThemeConfigResponse theme = null;
        String logoDataUri = null;
        
        try {
            theme = configServiceClient.getThemeConfig(tenantId);
            log.debug("Tema recuperado: primary={}, logo={}", theme.getPrimaryColor(), theme.getLogoUrl());
            
            if (theme != null && theme.getLogoUrl() != null) {
                String url = theme.getLogoUrl();
                String[] parts = url.split("/");
                if (parts.length >= 2) {
                    String filename = parts[parts.length - 1];
                    String tIdStr = parts[parts.length - 2];
                    try {
                        UUID tId = UUID.fromString(tIdStr);
                        byte[] logoBytes = configServiceClient.getLogoBytes(tId, filename);
                        if (logoBytes != null) {
                            String extension = filename.substring(filename.lastIndexOf(".") + 1);
                            String mimeType = "image/" + (extension.equals("svg") ? "svg+xml" : extension);
                            logoDataUri = "data:" + mimeType + ";base64," + java.util.Base64.getEncoder().encodeToString(logoBytes);
                            log.debug("Logo carregada com sucesso (data-uri)");
                        }
                    } catch (Exception tIdErr) {
                        log.warn("Erro ao extrair UUID da URL do logo: {}", url);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erro critico ao buscar tema para PDF: {}", e.getMessage());
        }

        String primaryColor = (theme != null && theme.getPrimaryColor() != null) ? theme.getPrimaryColor() : "#2563EB";
        String secondaryColor = (theme != null && theme.getSecondaryColor() != null) ? theme.getSecondaryColor() : "#1e3a8a";

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><style>");
        sb.append("body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e293b; margin: 0; padding: 0; background-color: #ffffff; }");
        sb.append(".page { padding: 40px; page-break-after: always; min-height: 1000px; position: relative; }");
        
        // Header
        sb.append(".report-header { border-bottom: 4px solid ").append(primaryColor).append("; margin-bottom: 30px; padding-bottom: 20px; display: table; width: 100%; }");
        sb.append(".header-left { display: table-cell; vertical-align: middle; }");
        sb.append(".header-right { display: table-cell; vertical-align: middle; text-align: right; }");
        sb.append(".logo-placeholder { font-size: 28px; font-weight: 900; color: ").append(primaryColor).append("; letter-spacing: -1px; margin-bottom: 5px; }");
        sb.append("h1 { color: ").append(secondaryColor).append("; font-size: 22px; margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }");
        sb.append(".company-info { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.8; }");
        
        // Employee Info Box
        sb.append(".info-grid { width: 100%; border: 1px solid #e2e8f0; background: linear-gradient(to right, #f8fafc, #ffffff); border-radius: 16px; margin-bottom: 30px; border-collapse: separate; border-spacing: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); }");
        sb.append(".info-label { font-weight: 800; color: #94a3b8; font-size: 9px; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px; }");
        sb.append(".info-value { font-size: 14px; font-weight: 700; color: #1e293b; }");
        
        // Table
        sb.append("table.main-table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 25px; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; }");
        sb.append("th { background-color: ").append(primaryColor).append("15; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 8.5px; padding: 14px 4px; border-bottom: 2px solid ").append(primaryColor).append("; text-align: center; }");
        sb.append("td { padding: 11px 4px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #334155; font-weight: 600; }");
        sb.append("tr:nth-child(even) { background-color: #fafbfc; }");
        sb.append(".weekend { background-color: #f8fafc; color: #94a3b8; opacity: 0.7; }");
        sb.append(".holiday { background-color: #fffbeb; color: #92400e; }");
        sb.append(".absent { color: #dc2626; font-weight: 800; text-transform: uppercase; font-size: 9px; }");
        sb.append(".col-date { font-weight: 800; width: 65px; color: #0f172a; border-right: 1px solid #f1f5f9; }");
        sb.append(".col-total { font-weight: 800; color: #0f172a; background-color: #f8fafc; }");
        
        // Summary Card
        sb.append(".summary-container { width: 100%; display: table; border-spacing: 20px 0; margin-top: 20px; }");
        sb.append(".summary-card { display: table-cell; width: 50%; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; background: #ffffff; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); vertical-align: top; }");
        sb.append(".summary-title { font-weight: 800; font-size: 14px; color: ").append(primaryColor).append("; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 18px; text-transform: uppercase; letter-spacing: 1px; }");
        sb.append(".summary-row { display: table; width: 100%; margin-bottom: 10px; font-size: 13px; }");
        sb.append(".summary-lbl { display: table-cell; text-align: left; color: #64748b; font-weight: 700; }");
        sb.append(".summary-val { display: table-cell; text-align: right; font-weight: 800; color: #1e293b; }");
        
        // Signatures
        sb.append(".sig-container { margin-top: 100px; width: 100%; display: table; border-spacing: 80px 0; }");
        sb.append(".sig-line { display: table-cell; border-top: 2px solid #e2e8f0; text-align: center; padding-top: 12px; font-size: 11px; color: #64748b; font-weight: 700; width: 45%; }");
        
        // Footer
        sb.append(".page-footer { position: absolute; bottom: 40px; left: 40px; right: 40px; text-align: center; font-size: 9px; color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }");
        
        sb.append("</style></head><body>");

        for (ExportData data : dataList) {
            String workSchedule = "Não definido";
            if (data.timesheet() != null && !data.timesheet().isEmpty()) {
                DailySummaryResponse firstDayWithSchedule = data.timesheet().stream()
                        .filter(d -> d.getScheduledEntry() != null && d.getScheduledExit() != null)
                        .findFirst()
                        .orElse(null);
                
                if (firstDayWithSchedule != null) {
                    workSchedule = formatTime(firstDayWithSchedule.getScheduledEntry()) + " - " + 
                                  formatTime(firstDayWithSchedule.getScheduledExit());
                }
            }

            sb.append("<div class='page'>");
            
            // Header
            sb.append("<div class='report-header'>");
            sb.append("<div class='header-left'>");
            if (logoDataUri != null) {
                sb.append("<img src='").append(logoDataUri).append("' style='max-height: 65px; max-width: 280px; margin-bottom: 15px;' />");
            } else {
                sb.append("<div class='logo-placeholder'>AxonRH</div>");
            }
            sb.append("<h1>Espelho de Ponto</h1><div class='company-info'>Branding Corporativo v2.0</div></div>");
            sb.append("<div class='header-right'><div class='info-label'>Período Base</div><div style='font-size: 18px; font-weight: 900; color: ").append(primaryColor).append(";'>")
              .append(startDate.format(DateTimeFormatter.ofPattern("MM/yyyy"))).append("</div><div style='font-size: 10px; color: #94a3b8; font-weight: 700; margin-top: 5px;'>ID: #").append(data.id().toString().substring(0,8).toUpperCase()).append("</div></div>");
            sb.append("</div>");

            // Info Box
            sb.append("<table class='info-grid'><tr>");
            sb.append("<td width='45%'><div class='info-label'>Colaborador</div><div class='info-value'>").append(data.name()).append("</div></td>");
            sb.append("<td width='35%'><div class='info-label'>Período Selecionado</div><div class='info-value'>")
              .append(startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
              .append(" - ")
              .append(endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
              .append("</div></td>");
            sb.append("<td width='20%'><div class='info-label'>Jornada Diária</div><div class='info-value'>").append(workSchedule).append("</div></td>");
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
                .append("<div class='summary-row' style='margin-top: 10px; border-top: 1px dashed #e2e8f0; pt: 8px;'><span class='summary-label'>Saldo Acumulado:</span><span class='summary-value' style='color: ").append(data.totals().overtimeMinutes() >= data.totals().deficitMinutes() ? "#16a34a" : "#dc2626").append(";'>")
                .append(data.totals().overtimeMinutes() >= data.totals().deficitMinutes() ? "+" : "-")
                .append(formatTime(LocalTime.of(0, 0).plusMinutes(Math.abs(data.totals().overtimeMinutes() - data.totals().deficitMinutes()))))
                .append("</span></div>")
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
