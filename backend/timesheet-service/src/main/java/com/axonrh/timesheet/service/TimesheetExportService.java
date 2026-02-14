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
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        List<DailySummaryResponse> timesheet = dailySummaryService.getTimesheetByPeriod(employeeId, startDate, endDate);
        
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

        String employeeName = employee != null ? employee.getFullName() : getEmployeeName(tenantId, employeeId);

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

            CellStyle labelStyle = workbook.createCellStyle();
            Font labelFont = workbook.createFont();
            labelFont.setBold(true);
            labelStyle.setFont(labelFont);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("ESPELHO DE PONTO ELETRÔNICO");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setColor(xssfColor.getIndex());
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            // Company Info
            Row companyRow = sheet.createRow(2);
            Cell c1 = companyRow.createCell(0); c1.setCellValue("Empregador:"); c1.setCellStyle(labelStyle);
            companyRow.createCell(1).setCellValue(company != null ? company.getLegalName() : "Empresa AxonRH");
            Cell c2 = companyRow.createCell(5); c2.setCellValue("CNPJ:"); c2.setCellStyle(labelStyle);
            companyRow.createCell(6).setCellValue(company != null ? formatCnpj(company.getCnpj()) : "");

            Row addrRow = sheet.createRow(3);
            Cell a1 = addrRow.createCell(0); a1.setCellValue("Endereço:"); a1.setCellStyle(labelStyle);
            addrRow.createCell(1).setCellValue(company != null ? company.getFullAddress() : "");

            // Employee Info
            Row employeeRow = sheet.createRow(5);
            Cell e1 = employeeRow.createCell(0); e1.setCellValue("Colaborador:"); e1.setCellStyle(labelStyle);
            employeeRow.createCell(1).setCellValue(employeeName);
            Cell e2 = employeeRow.createCell(5); e2.setCellValue("Matrícula:"); e2.setCellStyle(labelStyle);
            employeeRow.createCell(6).setCellValue(employee != null ? employee.getRegistrationNumber() : "");

            Row extraInfoRow = sheet.createRow(6);
            Cell p1 = extraInfoRow.createCell(0); p1.setCellValue("PIS/PASEP:"); p1.setCellStyle(labelStyle);
            extraInfoRow.createCell(1).setCellValue(employee != null ? employee.getPisPasep() : "");
            Cell p2 = extraInfoRow.createCell(5); p2.setCellValue("CPF:"); p2.setCellStyle(labelStyle);
            extraInfoRow.createCell(6).setCellValue(employee != null ? employee.getCpf() : "");

            Row periodRow = sheet.createRow(7);
            Cell pr1 = periodRow.createCell(0); pr1.setCellValue("Período:"); pr1.setCellStyle(labelStyle);
            periodRow.createCell(1).setCellValue(startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " a " + endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            Cell ad1 = periodRow.createCell(5); ad1.setCellValue("Admissão:"); ad1.setCellStyle(labelStyle);
            periodRow.createCell(6).setCellValue(employee != null && employee.getHireDate() != null ? employee.getHireDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");

            // Contracted Hours (Horários Contratuai)
            Row contractHeaderRow = sheet.createRow(9);
            Cell ch1 = contractHeaderRow.createCell(0); 
            ch1.setCellValue("HORÁRIOS CONTRATUAIS");
            CellStyle contractTitleStyle = workbook.createCellStyle();
            Font contractTitleFont = workbook.createFont();
            contractTitleFont.setBold(true);
            contractTitleStyle.setFont(contractTitleFont);
            ch1.setCellStyle(contractTitleStyle);

            DailySummaryResponse dayBase = timesheet.stream()
                    .filter(d -> d.getScheduledEntry() != null)
                    .findFirst().orElse(null);
            
            Row contractRow = sheet.createRow(10);
            if (dayBase != null) {
                contractRow.createCell(0).setCellValue("Entrada: " + formatTimeExcel(dayBase.getScheduledEntry()));
                contractRow.createCell(1).setCellValue("Intervalo: " + formatTimeExcel(dayBase.getScheduledBreakStart()) + " às " + formatTimeExcel(dayBase.getScheduledBreakEnd()));
                contractRow.createCell(3).setCellValue("Saída: " + formatTimeExcel(dayBase.getScheduledExit()));
            } else {
                contractRow.createCell(0).setCellValue("Escala não informada");
            }

            // Table Header
            Row headerRow = sheet.createRow(12);
            String[] columns = {"Data", "Marcações", "Entrada", "I. Início", "I. Fim", "Saída", "Faltas", "Extras", "Saldo", "Ocorrência"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Data
            int rowIdx = 13;
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle weekendStyle = workbook.createCellStyle();
            weekendStyle.cloneStyleFrom(dataStyle);
            weekendStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            weekendStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            for (DailySummaryResponse day : timesheet) {
                Row row = sheet.createRow(rowIdx++);
                boolean isWeekend = "Sábado".equalsIgnoreCase(day.getDayOfWeek()) || "Domingo".equalsIgnoreCase(day.getDayOfWeek());
                CellStyle currentStyle = isWeekend ? weekendStyle : dataStyle;

                Cell dateCell = row.createCell(0);
                dateCell.setCellValue(day.getSummaryDate().format(DateTimeFormatter.ofPattern("dd/MM/yy")));
                
                Cell punchesCell = row.createCell(1);
                punchesCell.setCellValue(formatPunches(day.getRecords()));
                
                if (Boolean.TRUE.equals(day.getIsAbsent())) {
                    Cell c = row.createCell(2);
                    c.setCellValue(day.getAbsenceType() != null ? day.getAbsenceType() : "FALTA");
                    sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(row.getRowNum(), row.getRowNum(), 2, 5));
                } else if (Boolean.TRUE.equals(day.getIsHoliday())) {
                    Cell c = row.createCell(2);
                    c.setCellValue("FERIADO: " + day.getHolidayName());
                    sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(row.getRowNum(), row.getRowNum(), 2, 5));
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
                    if (row.getCell(i) != null) row.getCell(i).setCellStyle(currentStyle);
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
                // Procura por tenantId e filename na URL para buscar bytes reais
                if (url.contains("/logos/")) {
                    String[] parts = url.split("/");
                    if (parts.length >= 2) {
                        String filename = parts[parts.length - 1];
                        String tIdStr = parts[parts.length - 2];
                        try {
                            UUID tId = UUID.fromString(tIdStr);
                            byte[] logoBytes = configServiceClient.getLogoBytes(tId, filename);
                            if (logoBytes != null) {
                                String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
                                String mimeType = "image/" + (extension.equals("svg") ? "svg+xml" : extension);
                                if (extension.equals("jpg")) mimeType = "image/jpeg";
                                logoDataUri = "data:" + mimeType + ";base64," + java.util.Base64.getEncoder().encodeToString(logoBytes);
                            }
                        } catch (Exception tIdErr) {}
                    }
                } else if (url.startsWith("http")) {
                   // Se for URL externa direta, tentamos usar ela mesmo (pode falhar no iText se não houver acesso)
                   // Mas para segurança em ambiente local/docker, o DataURI é melhor se o microserviço conseguir baixar.
                   // Por ora mantemos a lógica de parsing ou deixamos o iText tentar se for absoluto.
                }
            }
        } catch (Exception e) {}

        String primaryColor = (theme != null && theme.getPrimaryColor() != null) ? theme.getPrimaryColor() : "#2563EB";

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        sb.append("<link href='https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap' rel='stylesheet'>");
        sb.append("<style>");
        sb.append("body { font-family: 'Plus Jakarta Sans', 'Tahoma', sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 10px; line-height: 1.4; }");
        sb.append(".page { padding: 30px; page-break-after: always; position: relative; background: white; }");
        
        // Header
        sb.append(".header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid ").append(primaryColor).append("; padding-bottom: 10px; }");
        sb.append(".logo-box { width: 140px; }");
        sb.append(".title-box { text-align: right; flex-grow: 1; }");
        sb.append(".main-title { font-size: 18px; font-weight: 700; color: ").append(primaryColor).append("; margin: 0; text-transform: uppercase; }");
        sb.append(".period-label { font-size: 11px; color: #64748b; font-weight: 500; margin-top: 4px; }");
        
        // Info Tables (Company/Employee)
        sb.append(".info-section { width: 100%; margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }");
        sb.append(".info-row { display: flex; border-bottom: 1px solid #e2e8f0; }");
        sb.append(".info-row:last-child { border-bottom: none; }");
        sb.append(".info-item { padding: 6px 10px; border-right: 1px solid #e2e8f0; flex: 1; }");
        sb.append(".info-item:last-child { border-right: none; }");
        sb.append(".label { font-size: 7px; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 2px; }");
        sb.append(".value { font-size: 10px; font-weight: 600; color: #0f172a; }");
        sb.append(".bg-light { background-color: #f8fafc; }");

        // Contracted Hours Section
        sb.append(".contract-info { background-color: #f1f5f9; padding: 8px 12px; margin-bottom: 15px; border-radius: 4px; display: flex; gap: 30px; }");
        sb.append(".contract-title { font-weight: 700; color: #475569; font-size: 9px; margin-right: 10px; line-height: 1.6; }");

        // Main Table
        sb.append("table.main-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #cfd8dc; }");
        sb.append("table.main-table th { background-color: #f8fafc; border: 1px solid #cfd8dc; padding: 6px; font-size: 8px; text-transform: uppercase; color: #475569; font-weight: 700; }");
        sb.append("table.main-table td { border: 1px solid #e2e8f0; padding: 5px 4px; text-align: center; height: 18px; font-weight: 500; }");
        sb.append(".col-date { font-weight: 700; color: #334155; }");
        sb.append(".col-punches { text-align: left; padding-left: 8px !important; color: #0f172a; font-family: monospace; font-size: 9px; letter-spacing: 0.5px; }");
        sb.append(".weekend { background-color: #f8fafc; color: #94a3b8; }");
        sb.append(".holiday { background-color: #fff7ed; color: #c2410c; }");
        sb.append(".absent { background-color: #fef2f2; color: #b91c1c; }");
        sb.append(".positive { color: #15803d; }");
        sb.append(".negative { color: #b91c1c; }");
        
        // Signatures
        sb.append(".sig-container { margin-top: 50px; display: table; width: 100%; border-spacing: 20px 0; }");
        sb.append(".sig-box { display: table-cell; width: 45%; border-top: 1px solid #94a3b8; text-align: center; padding-top: 8px; font-size: 9px; color: #475569; }");
        
        // Footer info
        sb.append(".footer-meta { position: absolute; bottom: 15px; right: 30px; font-size: 7px; color: #94a3b8; }");

        sb.append("</style></head><body>");

        for (ExportData data : dataList) {
            sb.append("<div class='page'>");
            
            // Header Section
            sb.append("<div class='header-container'>");
            sb.append("<div class='logo-box'>");
            if (logoDataUri != null) {
                sb.append("<img src='").append(logoDataUri).append("' style='max-height: 45px;' />");
            } else {
                sb.append("<div style='font-size: 24px; font-weight: 800; color:").append(primaryColor).append("'>Axon<span style='color:#333'>RH</span></div>");
            }
            sb.append("</div>");
            sb.append("<div class='title-box'>");
            sb.append("<h1 class='main-title'>Espelho de Ponto Eletrônico</h1>");
            sb.append("<div class='period-label'>Período: ")
              .append(startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
              .append(" — ")
              .append(endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
              .append("</div>");
            sb.append("</div>");
            sb.append("</div>");

            // Company & Employee Info
            sb.append("<div class='info-section'>");
            sb.append("<div class='info-row'>");
            sb.append("<div class='info-item' style='flex: 3;'><span class='label'>Empregador</span><span class='value'>").append(company != null ? company.getLegalName() : "Empresa AxonRH").append("</span></div>");
            sb.append("<div class='info-item' style='flex: 2;'><span class='label'>CNPJ</span><span class='value'>").append(company != null && company.getCnpj() != null ? formatCnpj(company.getCnpj()) : "" ).append("</span></div>");
            sb.append("</div>");
            sb.append("<div class='info-row'>");
            sb.append("<div class='info-item' style='flex: 3;'><span class='label'>Endereço</span><span class='value'>").append(company != null ? company.getFullAddress() : "N/A").append("</span></div>");
            sb.append("<div class='info-item' style='flex: 2;'><span class='label'>Cidade/UF</span><span class='value'>").append(company != null ? getString(company.getAddressCity()) + "/" + getString(company.getAddressState()) : "").append("</span></div>");
            sb.append("</div>");
            sb.append("</div>");

            sb.append("<div class='info-section'>");
            sb.append("<div class='info-row bg-light'>");
            sb.append("<div class='info-item'><span class='label'>Colaborador</span><span class='value'>").append(data.name()).append("</span></div>");
            sb.append("<div class='info-item'><span class='label'>Matrícula</span><span class='value'>").append(data.employee() != null ? getString(data.employee().getRegistrationNumber()) : "").append("</span></div>");
            sb.append("<div class='info-item'><span class='label'>PIS/PASEP</span><span class='value'>").append(data.employee() != null ? getString(data.employee().getPisPasep()) : "").append("</span></div>");
            sb.append("<div class='info-item'><span class='label'>CPF</span><span class='value'>").append(data.employee() != null ? getString(data.employee().getCpf()) : "").append("</span></div>");
            sb.append("<div class='info-item'><span class='label'>Admissão</span><span class='value'>").append(data.employee() != null && data.employee().getHireDate() != null ? data.employee().getHireDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "").append("</span></div>");
            sb.append("</div>");
            sb.append("</div>");

            // Contracted Hours
            sb.append("<div class='contract-info'>");
            sb.append("<div class='contract-title'>HORÁRIOS<br/>CONTRATUAIS</div>");
            DailySummaryResponse dayBase = data.timesheet().stream()
                    .filter(d -> d.getScheduledEntry() != null)
                    .findFirst().orElse(null);
            
            if (dayBase != null) {
                sb.append("<div><span class='label'>Entrada</span><span class='value'>").append(formatTime(dayBase.getScheduledEntry())).append("</span></div>");
                sb.append("<div><span class='label'>Saída Intervalo</span><span class='value'>").append(formatTime(dayBase.getScheduledBreakStart())).append("</span></div>");
                sb.append("<div><span class='label'>Retorno Intervalo</span><span class='value'>").append(formatTime(dayBase.getScheduledBreakEnd())).append("</span></div>");
                sb.append("<div><span class='label'>Saída</span><span class='value'>").append(formatTime(dayBase.getScheduledExit())).append("</span></div>");
                sb.append("<div><span class='label'>Jornada</span><span class='value'>").append(dayBase.getExpectedWorkFormatted() != null ? dayBase.getExpectedWorkFormatted() : "").append("</span></div>");
            } else {
                sb.append("<div><span class='value'>Escala não informada no período</span></div>");
            }
            sb.append("</div>");

            // Main Table
            sb.append("<table class='main-table'><thead>");
            sb.append("<tr>");
            sb.append("<th rowspan='2' width='8%'>Data</th>");
            sb.append("<th rowspan='2' width='35%'>Marcações Ponto Eletrônico</th>");
            sb.append("<th colspan='4'>Jornada Realizada</th>");
            sb.append("<th rowspan='2' width='8%'>Saldo</th>");
            sb.append("<th rowspan='2' width='10%'>Ocorrência</th>");
            sb.append("</tr>");
            sb.append("<tr>");
            sb.append("<th width='7%'>Ent.</th><th width='7%'>S. Int.</th><th width='7%'>R. Int.</th><th width='7%'>Saí.</th>");
            sb.append("</tr>");
            sb.append("</thead><tbody>");

            for (DailySummaryResponse day : data.timesheet()) {
                String rowClass = "";
                if (day.getDayOfWeek().equals("Sábado") || day.getDayOfWeek().equals("Domingo")) rowClass = " class='weekend'";
                if (Boolean.TRUE.equals(day.getIsHoliday())) rowClass = " class='holiday'";
                if (Boolean.TRUE.equals(day.getIsAbsent())) rowClass = " class='absent'";

                sb.append("<tr").append(rowClass).append(">");
                sb.append("<td class='col-date'>").append(day.getSummaryDate().format(DateTimeFormatter.ofPattern("dd/MM"))).append("<br/><span style='font-size:6px; font-weight:normal; color:#94a3b8;'>").append(day.getDayOfWeek().substring(0, 3)).append("</span></td>");
                
                // Punches Column
                sb.append("<td class='col-punches'>").append(formatPunches(day.getRecords())).append("</td>");

                // Jornada Realizada
                if (Boolean.TRUE.equals(day.getIsAbsent())) {
                    sb.append("<td colspan='4' style='font-weight:700; font-size:8px;'>").append(day.getAbsenceType() != null ? day.getAbsenceType() : "FALTA").append("</td>");
                } else if (Boolean.TRUE.equals(day.getIsHoliday())) {
                    sb.append("<td colspan='4' style='font-size:8px;'>FERIADO: ").append(day.getHolidayName()).append("</td>");
                } else {
                    sb.append("<td>").append(formatTime(day.getFirstEntry())).append("</td>");
                    sb.append("<td>").append(formatTime(day.getBreakStart())).append("</td>");
                    sb.append("<td>").append(formatTime(day.getBreakEnd())).append("</td>");
                    sb.append("<td>").append(formatTime(day.getLastExit())).append("</td>");
                }

                String balClass = Boolean.TRUE.equals(day.getIsPositive()) ? " positive" : " negative";
                sb.append("<td class='").append(balClass).append("' style='font-weight:700;'>")
                  .append(day.getBalanceFormatted() != null ? (Boolean.TRUE.equals(day.getIsPositive()) ? "+" : "-") + day.getBalanceFormatted() : "00:00")
                  .append("</td>");
                
                String ocr = "OK";
                if (Boolean.TRUE.equals(day.getIsAbsent())) ocr = "Falta";
                else if (day.getHasMissingRecords() != null && day.getHasMissingRecords()) ocr = "Inc.";
                else if (day.getDeficitMinutes() != null && day.getDeficitMinutes() > 10) ocr = "Débito";
                else if (day.getOvertimeMinutes() != null && day.getOvertimeMinutes() > 10) ocr = "Extra";

                sb.append("<td style='font-size:7px'>").append(ocr).append("</td>");
                sb.append("</tr>");
            }
            sb.append("</tbody></table>");

            // Totals
            if (data.totals() != null) {
                sb.append("<div style='margin-top:10px; display:flex; gap:20px; font-size:9px;'>");
                sb.append("<div><strong>Total Trabalhado:</strong> ").append(data.totals().workedFormatted()).append("</div>");
                sb.append("<div><strong>Carga Esperada:</strong> ").append(calculateExpectedPeriod(data.timesheet())).append("</div>");
                sb.append("<div><strong>Extras:</strong> ").append(data.totals().overtimeFormatted()).append("</div>");
                sb.append("<div><strong>Débitos/Atrasos:</strong> ").append(data.totals().deficitFormatted()).append("</div>");
                sb.append("</div>");
            }

            // Signatures
            sb.append("<div class='sig-container' style='width: 100%; border-collapse: separate;'>");
            sb.append("<div class='sig-box'><strong>").append(data.name()).append("</strong><br/>Assinatura do Colaborador</div>");
            sb.append("<div class='sig-box'><strong>").append(company != null ? company.getLegalName() : "A Empresa").append("</strong><br/>Responsável / RH</div>");
            sb.append("</div>");

            sb.append("<div class='footer-meta'>Emitido via AxonRH em ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("</div>");
            sb.append("</div>");
        }

        sb.append("</body></html>");
        return sb.toString();
    }

    private String calculateExpectedPeriod(List<DailySummaryResponse> timesheet) {
        int total = timesheet.stream()
                .mapToInt(d -> d.getExpectedWorkMinutes() != null ? d.getExpectedWorkMinutes() : 0)
                .sum();
        int hours = total / 60;
        int mins = total % 60;
        return String.format("%02d:%02d", hours, mins);
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
