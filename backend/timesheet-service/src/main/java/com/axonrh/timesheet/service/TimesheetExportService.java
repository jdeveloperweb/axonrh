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

    public byte[] exportToPdf(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        List<DailySummaryResponse> timesheet = dailySummaryService.getTimesheetByPeriod(employeeId, startDate, endDate);
        DailySummaryService.PeriodTotals totals = dailySummaryService.getPeriodTotals(employeeId, startDate, endDate);
        
        String html = generateHtml(timesheet, totals, startDate, endDate, "Colaborador: " + employeeId);
        
        ByteArrayOutputStream target = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(html, target);
        return target.toByteArray();
    }

    public byte[] exportMassToPdf(LocalDate startDate, LocalDate endDate) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        List<UUID> employeeIds = employeeScheduleRepository.findDistinctEmployeeIdsByTenantId(tenantId);
        
        StringBuilder fullHtml = new StringBuilder();
        fullHtml.append("<html><head><style>")
                .append("body { font-family: 'Helvetica', sans-serif; color: #333; margin: 0; }")
                .append(".page { padding: 40px; page-break-after: always; }")
                .append("h1 { color: #000; text-align: center; font-size: 18px; margin-bottom: 5px; }")
                .append(".subtitle { text-align: center; font-size: 14px; margin-bottom: 20px; color: #666; }")
                .append("table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }")
                .append("th, td { border: 1px solid #ccc; padding: 6px 4px; text-align: center; font-size: 10px; }")
                .append("th { background-color: #f9f9f9; font-weight: bold; }")
                .append(".weekend { background-color: #f2f2f2; }")
                .append(".summary { margin-top: 10px; border: 1px solid #eee; padding: 10px; border-radius: 4px; }")
                .append(".summary-title { font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }")
                .append(".summary-item { margin-bottom: 5px; font-size: 11px; }")
                .append("</style></head><body>");

        for (UUID employeeId : employeeIds) {
            List<DailySummaryResponse> timesheet = dailySummaryService.getTimesheetByPeriod(employeeId, startDate, endDate);
            DailySummaryService.PeriodTotals totals = dailySummaryService.getPeriodTotals(employeeId, startDate, endDate);
            
            fullHtml.append("<div class='page'>");
            fullHtml.append("<h1>ESPELHO DE PONTO</h1>");
            fullHtml.append("<div class='subtitle'>Período: ").append(startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .append(" a ").append(endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .append(" | Colaborador ID: ").append(employeeId).append("</div>");

            fullHtml.append("<table><thead><tr>")
                .append("<th>Data</th><th>Dia</th><th>Entrada</th><th>I. Inic</th><th>I. Fim</th><th>Saída</th>")
                .append("<th>Trabalhado</th><th>Extra</th><th>Falta</th><th>Saldo</th>")
                .append("</tr></thead><tbody>");

            for (DailySummaryResponse day : timesheet) {
                String weekendClass = (day.getDayOfWeek().equals("Sábado") || day.getDayOfWeek().equals("Domingo")) ? " class='weekend'" : "";
                fullHtml.append("<tr").append(weekendClass).append(">")
                    .append("<td>").append(day.getSummaryDate().format(DateTimeFormatter.ofPattern("dd/MM"))).append("</td>")
                    .append("<td>").append(day.getDayOfWeek().substring(0, 3)).append("</td>")
                    .append("<td>").append(getString(day.getFirstEntry())).append("</td>")
                    .append("<td>").append(getString(day.getBreakStart())).append("</td>")
                    .append("<td>").append(getString(day.getBreakEnd())).append("</td>")
                    .append("<td>").append(getString(day.getLastExit())).append("</td>")
                    .append("<td>").append(day.getWorkedFormatted()).append("</td>")
                    .append("<td>").append(day.getOvertimeFormatted()).append("</td>")
                    .append("<td>").append(day.getDeficitFormatted()).append("</td>")
                    .append("<td>").append(day.isPositive() ? "+" : "-").append(day.getBalanceFormatted()).append("</td>")
                    .append("</tr>");
            }

            fullHtml.append("</tbody></table>");

            fullHtml.append("<div class='summary'>")
                .append("<div class='summary-title'>RESUMO DO PERÍODO</div>")
                .append("<div class='summary-item'>Total Trabalhado: ").append(totals.getWorkedFormatted()).append("</div>")
                .append("<div class='summary-item'>Total Extras: ").append(totals.getOvertimeFormatted()).append("</div>")
                .append("<div class='summary-item'>Total Faltas/Atrasos: ").append(totals.getDeficitFormatted()).append("</div>")
                .append("</div>");
            fullHtml.append("</div>"); // end page
        }
        
        fullHtml.append("</body></html>");
        
        ByteArrayOutputStream target = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(fullHtml.toString(), target);
        return target.toByteArray();
    }

    public byte[] exportToExcel(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        List<DailySummaryResponse> timesheet = dailySummaryService.getTimesheetByPeriod(employeeId, startDate, endDate);
        
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Espelho de Ponto");
            
            // Header
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Data", "Dia", "Entrada", "Saida", "Trab.", "Extra", "Falta", "Saldo"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
            }
            
            // Data
            int rowIdx = 1;
            for (DailySummaryResponse day : timesheet) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(day.getSummaryDate().toString());
                row.createCell(1).setCellValue(day.getDayOfWeek());
                row.createCell(2).setCellValue(day.getFirstEntry());
                row.createCell(3).setCellValue(day.getLastExit());
                row.createCell(4).setCellValue(day.getWorkedFormatted());
                row.createCell(5).setCellValue(day.getOvertimeFormatted());
                row.createCell(6).setCellValue(day.getDeficitFormatted());
                row.createCell(7).setCellValue((day.isPositive() ? "+" : "-") + day.getBalanceFormatted());
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

        html.append("<h1>ESPELHO DE PONTO</h1>");
        html.append("<div class='subtitle'>Período: ").append(start.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
            .append(" a ").append(end.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
            .append(" | ").append(title).append("</div>");

        html.append("<table><thead><tr>")
            .append("<th>Data</th><th>Dia</th><th>Entrada</th><th>I. Inic</th><th>I. Fim</th><th>Saída</th>")
            .append("<th>Trabalhado</th><th>Extra</th><th>Falta</th><th>Saldo</th>")
            .append("</tr></thead><tbody>");

        for (DailySummaryResponse day : timesheet) {
            String weekendClass = (day.getDayOfWeek().equals("Sábado") || day.getDayOfWeek().equals("Domingo")) ? " class='weekend'" : "";
            html.append("<tr").append(weekendClass).append(">")
                .append("<td>").append(day.getSummaryDate().format(DateTimeFormatter.ofPattern("dd/MM"))).append("</td>")
                .append("<td>").append(day.getDayOfWeek().substring(0, 3)).append("</td>")
                .append("<td>").append(getString(day.getFirstEntry())).append("</td>")
                .append("<td>").append(getString(day.getBreakStart())).append("</td>")
                .append("<td>").append(getString(day.getBreakEnd())).append("</td>")
                .append("<td>").append(getString(day.getLastExit())).append("</td>")
                .append("<td>").append(day.getWorkedFormatted()).append("</td>")
                .append("<td>").append(day.getOvertimeFormatted()).append("</td>")
                .append("<td>").append(day.getDeficitFormatted()).append("</td>")
                .append("<td>").append(day.isPositive() ? "+" : "-").append(day.getBalanceFormatted()).append("</td>")
                .append("</tr>");
        }

        html.append("</tbody></table>");

        html.append("<div class='summary'>")
            .append("<div class='summary-title'>RESUMO DO PERÍODO</div>")
            .append("<div class='summary-grid'>")
            .append("<div class='summary-item'>Total Trabalhado: ").append(totals.getWorkedFormatted()).append("</div>")
            .append("<div class='summary-item'>Total Extras: ").append(totals.getOvertimeFormatted()).append("</div>")
            .append("<div class='summary-item'>Total Faltas/Atrasos: ").append(totals.getDeficitFormatted()).append("</div>")
            .append("<div class='summary-item'>Total Noturno: ").append(totals.getNightShiftFormatted()).append("</div>")
            .append("<div class='summary-item'>Qtd. Faltas: ").append(totals.getAbsences()).append("</div>")
            .append("</div></div>");

        html.append("</body></html>");
        return html.toString();
    }

    private String getString(String val) {
        return val == null ? "" : val;
    }
}
