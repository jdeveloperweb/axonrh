package com.axonrh.timesheet.service;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.dto.DailySummaryResponse;
import com.axonrh.timesheet.repository.EmployeeScheduleRepository;
import com.itextpdf.html2pdf.HtmlConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
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
        List<UUID> employeeIds = employeeScheduleRepository.findDistinctEmployeeIdsByTenantId(tenantId);
        
        List<ExportData> exportList = employeeIds.stream().map(id -> {
            List<DailySummaryResponse> timesheet = dailySummaryService.getTimesheetByPeriod(id, startDate, endDate);
            DailySummaryService.PeriodTotals totals = dailySummaryService.getPeriodTotals(id, startDate, endDate);
            return new ExportData(id, getEmployeeName(tenantId, id), timesheet, totals);
        }).toList();

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
                    row.createCell(2).setCellValue(getString(day.getFirstEntry()));
                    row.createCell(3).setCellValue(getString(day.getBreakStart()));
                    row.createCell(4).setCellValue(getString(day.getBreakEnd()));
                    row.createCell(5).setCellValue(getString(day.getLastExit()));
                }
                
                row.createCell(6).setCellValue(day.getWorkedFormatted());
                row.createCell(7).setCellValue(day.getOvertimeFormatted());
                row.createCell(8).setCellValue(day.getDeficitFormatted());
                row.createCell(9).setCellValue(day.getNightShiftFormatted());
                row.createCell(10).setCellValue((day.isPositive() ? "+" : "-") + day.getBalanceFormatted());
                row.createCell(11).setCellValue(day.getIsHoliday() ? "Feriado" : day.getIsAbsent() ? "Falta" : "OK");
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

    private String generateHtml(List<DailySummaryResponse> timesheet, DailySummaryService.PeriodTotals totals, LocalDate start, LocalDate end, String title) {
        StringBuilder html = new StringBuilder();
        html.append("<html><head><style>")
                .append("body { font-family: 'Helvetica', sans-serif; color: #333; margin: 20px; }")
                .append("h1 { color: #000; text-align: center; font-size: 18px; margin-bottom: 5px; }")
                .append(".subtitle { text-align: center; font-size: 14px; margin-bottom: 20px; color: #666; }")
                .append("table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }")
                .append("th, td { border: 1px solid #ccc; padding: 6px 4px; text-align: center; font-size: 10px; }")
                .append("th { background-color: #f9f9f9; font-weight: bold; }")
                .append(".weekend { background-color: #f2f2f2; }")
                .append(".summary { margin-top: 10px; border: 1px solid #eee; padding: 10px; border-radius: 4px; }")
                .append(".summary-title { font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }")
                .append(".summary-grid { display: block; }")
                .append(".summary-item { margin-bottom: 5px; font-size: 11px; }")
                .append("</style></head><body>");

    private String getEmployeeName(UUID tenantId, UUID employeeId) {
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
        sb.append("<html><head><style>")
                .append("body { font-family: 'Helvetica', sans-serif; color: #333; margin: 0; padding: 20px; }")
                .append(".page { page-break-after: always; display: flex; flex-direction: column; min-height: 98vh; position: relative; }")
                .append(".header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }")
                .append("h1 { color: #1e3a8a; font-size: 20px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }")
                .append(".company-info { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: bold; }")
                .append(".subtitle { font-size: 13px; margin-bottom: 15px; background: #eff6ff; padding: 12px; border-radius: 6px; border: 1px solid #bfdbfe; display: flex; justify-content: space-between; }")
                .append("table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; table-layout: fixed; }")
                .append("th, td { border: 1px solid #e2e8f0; padding: 5px 3px; text-align: center; overflow: hidden; }")
                .append("th { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; font-size: 9px; color: #475569; }")
                .append(".weekend { background-color: #f1f5f9; color: #94a3b8; }")
                .append(".holiday { background-color: #fef3c7; color: #92400e; }")
                .append(".absent { color: #be123c; font-weight: bold; }")
                .append(".summary-container { display: flex; justify-content: space-between; margin-top: auto; padding-top: 15px; border-top: 1px solid #e2e8f0; }")
                .append(".summary-box { width: 48%; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; background: #fdfdfd; }")
                .append(".summary-title { font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; font-size: 11px; color: #1e3a8a; }")
                .append(".summary-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 10px; }")
                .append(".signatures { margin-top: 30px; display: flex; justify-content: space-between; width: 100%; }")
                .append(".signature-line { width: 45%; border-top: 1px solid #64748b; text-align: center; padding-top: 5px; font-size: 10px; color: #475569; margin-top: 30px; }")
                .append(".footer { text-align: center; font-size: 8px; color: #94a3b8; position: absolute; bottom: 0; width: 100%; }")
                .append("</style></head><body>");

        for (ExportData data : dataList) {
            sb.append("<div class='page'>");
            sb.append("<div class='header'><h1>Espelho de Ponto Eletrônico</h1>")
                .append("<div class='company-info'>AxonRH - Gestão Estratégica de Pessoas</div></div>");

            sb.append("<div class='subtitle'>")
                .append("<div><strong>Colaborador:</strong> ").append(data.name()).append("</div>")
                .append("<div><strong>Período:</strong> ").append(startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .append(" a ").append(endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</div></div>");

            sb.append("<table><thead><tr>")
                .append("<th style='width: 8%'>Data</th><th style='width: 6%'>Dia</th>")
                .append("<th style='width: 8%'>Entrada</th><th style='width: 8%'>I. Início</th>")
                .append("<th style='width: 8%'>I. Fim</th><th style='width: 8%'>Saída</th>")
                .append("<th style='width: 9%'>Trab.</th><th style='width: 9%'>Extras</th>")
                .append("<th style='width: 9%'>Faltas</th><th style='width: 9%'>Noturno</th>")
                .append("<th style='width: 10%'>Saldo</th><th style='width: 10%'>Status</th>")
                .append("</tr></thead><tbody>");

            for (DailySummaryResponse day : data.timesheet()) {
                String rowClass = "";
                if (Boolean.TRUE.equals(day.getIsHoliday())) rowClass = " class='holiday'";
                else if (day.getDayOfWeek().equals("Sábado") || day.getDayOfWeek().equals("Domingo")) rowClass = " class='weekend'";
                
                sb.append("<tr").append(rowClass).append(">")
                    .append("<td>").append(day.getSummaryDate().format(DateTimeFormatter.ofPattern("dd/MM/yy"))).append("</td>")
                    .append("<td>").append(day.getDayOfWeek().substring(0, 3)).append("</td>");
                
                if (Boolean.TRUE.equals(day.getIsAbsent())) {
                    sb.append("<td colspan='4' class='absent'>").append(day.getAbsenceType() != null ? day.getAbsenceType() : "FALTA").append("</td>");
                } else if (Boolean.TRUE.equals(day.getIsHoliday())) {
                    sb.append("<td colspan='4'>FERIADO: ").append(day.getHolidayName() != null ? day.getHolidayName() : "").append("</td>");
                } else {
                    sb.append("<td>").append(getString(day.getFirstEntry())).append("</td>")
                        .append("<td>").append(getString(day.getBreakStart())).append("</td>")
                        .append("<td>").append(getString(day.getBreakEnd())).append("</td>")
                        .append("<td>").append(getString(day.getLastExit())).append("</td>");
                }

                sb.append("<td>").append(day.getWorkedFormatted()).append("</td>")
                    .append("<td>").append(day.getOvertimeFormatted()).append("</td>")
                    .append("<td>").append(day.getDeficitFormatted()).append("</td>")
                    .append("<td>").append(day.getNightShiftFormatted()).append("</td>")
                    .append("<td>").append(day.isPositive() ? "+" : "-").append(day.getBalanceFormatted()).append("</td>")
                    .append("<td>").append(day.getIsHoliday() ? "Feriado" : day.getIsAbsent() ? "Falta" : "OK").append("</td>")
                    .append("</tr>");
            }
            sb.append("</tbody></table>");

            sb.append("<div class='summary-container'>");
            sb.append("<div class='summary-box'><div class='summary-title'>RESUMO DE HORAS</div>")
                .append("<div class='summary-row'><span>Horas Trabalhadas:</span><strong>").append(data.totals().workedFormatted()).append("</strong></div>")
                .append("<div class='summary-row'><span>Horas Extras:</span><strong>").append(data.totals().overtimeFormatted()).append("</strong></div>")
                .append("<div class='summary-row'><span>Faltas / Débitos:</span><strong style='color:#be123c'>").append(data.totals().deficitFormatted()).append("</strong></div>")
                .append("<div class='summary-row'><span>Adic. Noturno:</span><strong>").append(data.totals().nightShiftFormatted()).append("</strong></div>")
                .append("</div>");

            sb.append("<div class='summary-box'><div class='summary-title'>OCORRÊNCIAS</div>")
                .append("<div class='summary-row'><span>Dias em Falta:</span><strong>").append(data.totals().absences()).append("</strong></div>")
                .append("<div class='summary-row'><span>Atrasos (Min):</span><strong>").append(data.totals().lateArrivalFormatted()).append("</strong></div>")
                .append("</div></div>");

            sb.append("<div class='signatures'><div class='signature-line'>Assinatura do Colaborador</div>")
                .append("<div class='signature-line'>Assinatura do Responsável</div></div>");

            sb.append("<div class='footer'>Gerado em ").append(java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("</div></div>");
        }

        sb.append("</body></html>");
        return sb.toString();
    }

    private String getString(java.time.LocalTime val) {
        return val == null ? "" : val.toString();
    }

    private String getString(String val) {
        return val == null ? "" : val;
    }
}
