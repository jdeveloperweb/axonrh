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
    private final com.axonrh.timesheet.client.CoreServiceClient coreServiceClient;

    public byte[] exportToPdf(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        List<DailySummaryResponse> timesheet = dailySummaryService.getTimesheetByPeriod(employeeId, startDate, endDate);
        DailySummaryService.PeriodTotals totals = dailySummaryService.getPeriodTotals(employeeId, startDate, endDate);
        
        com.axonrh.timesheet.dto.EmployeeDTO employee = null;
        try {
            employee = employeeClient.getEmployee(employeeId);
        } catch (Exception e) {
            log.warn("Erro ao buscar dados do colaborador para exportacao: {}", e.getMessage());
        }

        com.axonrh.timesheet.client.CoreServiceClient.CompanyProfileDTO company = null;
        try {
            company = coreServiceClient.getCompanyProfile(tenantId);
        } catch (Exception e) {
            log.warn("Erro ao buscar dados da empresa para exportacao: {}", e.getMessage());
        }
        
        String employeeName = employee != null ? employee.getFullName() : getEmployeeName(tenantId, employeeId);
        String html = generateHtmlContent(List.of(new ExportData(employeeId, employeeName, employee, timesheet, totals)), startDate, endDate, company);
        
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
                com.axonrh.timesheet.dto.EmployeeDTO employee = null;
                try {
                    employee = employeeClient.getEmployee(id);
                } catch (Exception ee) {}
                
                return new ExportData(id, employee != null ? employee.getFullName() : getEmployeeName(tenantId, id), employee, timesheet, totals);
            } catch (Exception e) {
                log.error("Erro ao processar dados do colaborador {} para exportacao em massa: {}", id, e.getMessage());
                return null;
            }
        }).filter(java.util.Objects::nonNull).toList();

        com.axonrh.timesheet.client.CoreServiceClient.CompanyProfileDTO company = null;
        try {
            company = coreServiceClient.getCompanyProfile(tenantId);
        } catch (Exception e) {}

        String html = generateHtmlContent(exportList, startDate, endDate, company);
        
        ByteArrayOutputStream target = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(html, target);
        return target.toByteArray();
    }

    public byte[] exportToExcel(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        com.axonrh.timesheet.dto.EmployeeDTO employee = null;
        try {
            employee = employeeClient.getEmployee(employeeId);
        } catch (Exception e) {}

        com.axonrh.timesheet.client.CoreServiceClient.CompanyProfileDTO company = null;
        try {
            company = coreServiceClient.getCompanyProfile(tenantId);
        } catch (Exception e) {}

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
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("ESPELHO DE PONTO ELETRÔNICO");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            // Company & Employee Info
            Row companyRow = sheet.createRow(2);
            companyRow.createCell(0).setCellValue("Empregador:");
            companyRow.createCell(1).setCellValue(company != null ? company.getLegalName() : "Empresa AxonRH");
            companyRow.createCell(5).setCellValue("CNPJ:");
            companyRow.createCell(6).setCellValue(company != null ? formatCnpj(company.getCnpj()) : "");

            Row employeeRow = sheet.createRow(3);
            employeeRow.createCell(0).setCellValue("Colaborador:");
            employeeRow.createCell(1).setCellValue(employeeName);
            employeeRow.createCell(5).setCellValue("PIS/PASEP:");
            employeeRow.createCell(6).setCellValue(employee != null ? employee.getPisPasep() : "");

            Row periodRow = sheet.createRow(4);
            periodRow.createCell(0).setCellValue("Período:");
            periodRow.createCell(1).setCellValue(startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " a " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

            // Table Header
            Row headerRow = sheet.createRow(6);
            String[] columns = {"Data", "Marcações", "Entrada", "I. Início", "I. Fim", "Saída", "Faltas", "Extras", "Saldo", "Ocorrência"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Data
            int rowIdx = 7;
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setAlignment(HorizontalAlignment.CENTER);

            for (DailySummaryResponse day : timesheet) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(day.getSummaryDate().format(DateTimeFormatter.ofPattern("dd/MM/yy")));
                row.createCell(1).setCellValue(formatPunches(day.getRecords()));
                
                if (Boolean.TRUE.equals(day.getIsAbsent())) {
                    row.createCell(2).setCellValue(day.getAbsenceType() != null ? day.getAbsenceType() : "FALTA");
                } else if (Boolean.TRUE.equals(day.getIsHoliday())) {
                    row.createCell(2).setCellValue("FERIADO: " + day.getHolidayName());
                } else {
                    row.createCell(2).setCellValue(formatTimeExcel(day.getFirstEntry()));
                    row.createCell(3).setCellValue(formatTimeExcel(day.getBreakStart()));
                    row.createCell(4).setCellValue(formatTimeExcel(day.getBreakEnd()));
                    row.createCell(5).setCellValue(formatTimeExcel(day.getLastExit()));
                }
                
                row.createCell(6).setCellValue(day.getDeficitFormatted());
                row.createCell(7).setCellValue(day.getOvertimeFormatted());
                row.createCell(8).setCellValue((Boolean.TRUE.equals(day.getIsPositive()) ? "+" : "-") + day.getBalanceFormatted());
                
                String ocr = "OK";
                if (Boolean.TRUE.equals(day.getIsAbsent())) ocr = "Falta";
                else if (day.getHasMissingRecords() != null && day.getHasMissingRecords()) ocr = "Inc.";
                
                row.createCell(9).setCellValue(ocr);

                for(int i=0; i<columns.length; i++) {
                    if (row.getCell(i) != null) row.getCell(i).setCellStyle(dataStyle);
                }
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

    private record ExportData(UUID id, String name, com.axonrh.timesheet.dto.EmployeeDTO employee, List<DailySummaryResponse> timesheet, DailySummaryService.PeriodTotals totals) {}

    private String generateHtmlContent(List<ExportData> dataList, LocalDate startDate, LocalDate endDate, com.axonrh.timesheet.client.CoreServiceClient.CompanyProfileDTO company) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        ConfigServiceClient.ThemeConfigResponse theme = null;
        String logoDataUri = null;
        
        try {
            theme = configServiceClient.getThemeConfig(tenantId);
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
                        }
                    } catch (Exception tIdErr) {}
                }
            }
        } catch (Exception e) {}

        String primaryColor = (theme != null && theme.getPrimaryColor() != null) ? theme.getPrimaryColor() : "#2563EB";

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><style>");
        sb.append("body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 0; font-size: 10px; }");
        sb.append(".page { padding: 20px; page-break-after: always; position: relative; }");
        
        sb.append(".header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }");
        sb.append(".header-table td { border: 1px solid #ccc; padding: 5px; vertical-align: middle; }");
        sb.append(".logo-cell { width: 150px; text-align: center; }");
        sb.append(".title-cell { text-align: center; font-weight: bold; font-size: 14px; }");
        sb.append(".info-cell { font-size: 9px; }");
        
        sb.append(".company-info-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }");
        sb.append(".company-info-table td { border: 1px solid #ccc; padding: 3px 8px; }");
        sb.append(".label { font-weight: bold; color: #555; font-size: 8px; text-transform: uppercase; display: block; }");
        sb.append(".value { font-weight: bold; font-size: 10px; }");

        // Table
        sb.append("table.main-table { width: 100%; border-collapse: collapse; margin-top: 10px; }");
        sb.append("table.main-table th { background-color: #f2f2f2; border: 1px solid #ccc; padding: 4px; font-size: 8px; text-transform: uppercase; }");
        sb.append("table.main-table td { border: 1px solid #ccc; padding: 3px; text-align: center; height: 18px; }");
        sb.append(".col-date { font-weight: bold; }");
        sb.append(".col-punches { text-align: left; padding-left: 5px !important; font-size: 9px; letter-spacing: 1px; }");
        sb.append(".weekend { background-color: #f9f9f9; }");
        
        // Signatures
        sb.append(".sig-container { margin-top: 40px; width: 100%; }");
        sb.append(".sig-box { width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 5px; display: inline-block; margin: 0 2%; }");
        
        sb.append("</style></head><body>");

        for (ExportData data : dataList) {
            sb.append("<div class='page'>");
            
            // Top Header
            sb.append("<table class='header-table'><tr>");
            sb.append("<td class='logo-cell'>");
            if (logoDataUri != null) {
                sb.append("<img src='").append(logoDataUri).append("' style='max-height: 40px;' />");
            } else {
                sb.append("<span style='font-weight:bold; color:").append(primaryColor).append("'>AxonRH</span>");
            }
            sb.append("</td>");
            sb.append("<td class='title-cell'>ESPELHO DE PONTO ELETRÔNICO<br/><span style='font-size:10px; font-weight:normal'>PERÍODO: ")
              .append(startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
              .append(" ATÉ ")
              .append(endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
              .append("</span></td>");
            sb.append("<td class='info-cell' style='width:120px'>Emitido em: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("</td>");
            sb.append("</tr></table>");

            // Employer & Employee Info
            sb.append("<table class='company-info-table'>");
            sb.append("<tr>");
            sb.append("<td width='50%'><span class='label'>Empregador</span><span class='value'>").append(company != null ? company.getLegalName() : "Empresa AxonRH").append("</span></td>");
            sb.append("<td width='25%'><span class='label'>CNPJ</span><span class='value'>").append(company != null && company.getCnpj() != null ? formatCnpj(company.getCnpj()) : "" ).append("</span></td>");
            sb.append("<td width='25%'><span class='label'>CEI/CAEPF</span><span class='value'></span></td>");
            sb.append("</tr>");
            sb.append("<tr>");
            sb.append("<td colspan='3'><span class='label'>Endereço</span><span class='value'>").append(company != null ? company.getFullAddress() : "").append("</span></td>");
            sb.append("</tr>");
            sb.append("<tr>");
            sb.append("<td width='50%'><span class='label'>Nome</span><span class='value'>").append(data.name()).append("</span></td>");
            sb.append("<td width='25%'><span class='label'>Nº PIS/PASEP</span><span class='value'>").append(data.employee() != null && data.employee().getPisPasep() != null ? data.employee().getPisPasep() : "").append("</span></td>");
            sb.append("<td width='25%'><span class='label'>Admissão</span><span class='value'>").append(data.employee() != null && data.employee().getHireDate() != null ? data.employee().getHireDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "").append("</span></td>");
            sb.append("</tr>");
            sb.append("</table>");

            // Main Table
            sb.append("<table class='main-table'><thead>");
            sb.append("<tr>");
            sb.append("<th rowspan='2'>Dia</th>");
            sb.append("<th rowspan='2' width='30%'>Marcações Registradas no Ponto Eletrônico</th>");
            sb.append("<th colspan='4'>Jornada Realizada</th>");
            sb.append("<th rowspan='2'>Saldo</th>");
            sb.append("<th rowspan='2'>Ocorrência</th>");
            sb.append("</tr>");
            sb.append("<tr>");
            sb.append("<th>Entrada</th><th>Saída</th><th>Entrada</th><th>Saída</th>");
            sb.append("</tr>");
            sb.append("</thead><tbody>");

            for (DailySummaryResponse day : data.timesheet()) {
                String rowClass = (day.getDayOfWeek().equals("Sábado") || day.getDayOfWeek().equals("Domingo")) ? " class='weekend'" : "";
                sb.append("<tr").append(rowClass).append(">");
                sb.append("<td class='col-date'>").append(day.getSummaryDate().format(DateTimeFormatter.ofPattern("dd/MM"))).append("</td>");
                
                // Punches Column
                String punches = formatPunches(day.getRecords());
                sb.append("<td class='col-punches'>").append(punches).append("</td>");

                // Jornada Realizada
                if (Boolean.TRUE.equals(day.getIsAbsent())) {
                    sb.append("<td colspan='4' style='color:#777;'>").append(day.getAbsenceType() != null ? day.getAbsenceType() : "FALTA").append("</td>");
                } else if (Boolean.TRUE.equals(day.getIsHoliday())) {
                    sb.append("<td colspan='4' style='color:#777; font-style:italic;'>FERIADO: ").append(day.getHolidayName()).append("</td>");
                } else {
                    sb.append("<td>").append(formatTime(day.getFirstEntry())).append("</td>");
                    sb.append("<td>").append(formatTime(day.getBreakStart())).append("</td>");
                    sb.append("<td>").append(formatTime(day.getBreakEnd())).append("</td>");
                    sb.append("<td>").append(formatTime(day.getLastExit())).append("</td>");
                }

                sb.append("<td style='font-weight:bold;'>").append(day.getBalanceFormatted() != null ? (Boolean.TRUE.equals(day.getIsPositive()) ? "+" : "-") + day.getBalanceFormatted() : "00:00").append("</td>");
                
                String ocr = "OK";
                if (Boolean.TRUE.equals(day.getIsAbsent())) ocr = "Falta";
                else if (day.getHasMissingRecords() != null && day.getHasMissingRecords()) ocr = "Inc.";
                else if (day.getDeficitMinutes() != null && day.getDeficitMinutes() > 0) ocr = "Débito";

                sb.append("<td style='font-size:8px'>").append(ocr).append("</td>");
                sb.append("</tr>");
            }
            sb.append("</tbody></table>");

            // Contractual info
            sb.append("<div style='margin-top:15px; font-weight:bold; font-size:9px'>HORÁRIOS CONTRATUAIS DO EMPREGADO</div>");
            sb.append("<table class='main-table' style='width:50%; text-align:center; font-size:9px'>");
            sb.append("<thead><tr><th>Entrada</th><th>Saída</th><th>Entrada</th><th>Saída</th></tr></thead><tbody><tr>");
            
            // Pega o primeiro dia com jornada para mostrar como base
            DailySummaryResponse dayBase = data.timesheet().stream()
                    .filter(d -> d.getScheduledEntry() != null)
                    .findFirst().orElse(null);
            
            if (dayBase != null) {
                sb.append("<td>").append(formatTime(dayBase.getScheduledEntry())).append("</td>")
                  .append("<td>").append(formatTime(dayBase.getScheduledBreakStart())).append("</td>")
                  .append("<td>").append(formatTime(dayBase.getScheduledBreakEnd())).append("</td>")
                  .append("<td>").append(formatTime(dayBase.getScheduledExit())).append("</td>");
            } else {
                sb.append("<td>--:--</td><td>--:--</td><td>--:--</td><td>--:--</td>");
            }
            sb.append("</tr></tbody></table>");

            // Signatures
            sb.append("<div class='sig-container'>");
            sb.append("<div class='sig-box'>").append(data.name()).append("</div>");
            sb.append("<div class='sig-box'>Responsável</div>");
            sb.append("</div>");

            sb.append("</div>");
        }

        sb.append("</body></html>");
        return sb.toString();
    }

    private String formatPunches(List<com.axonrh.timesheet.dto.TimeRecordResponse> records) {
        if (records == null || records.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < records.size(); i++) {
            if (i > 0) sb.append(" ");
            LocalTime time = records.get(i).getRecordTime();
            if (time != null) {
                sb.append(time.format(DateTimeFormatter.ofPattern("HH:mm")));
            }
        }
        return sb.toString();
    }

    private String formatCnpj(String cnpj) {
        if (cnpj == null || cnpj.length() != 14) return cnpj;
        return cnpj.substring(0, 2) + "." + cnpj.substring(2, 5) + "." + cnpj.substring(5, 8) + "/" + cnpj.substring(8, 12) + "-" + cnpj.substring(12, 14);
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
