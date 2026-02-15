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
        
        // Buscar escala contratual real do banco para exibir os horários corretos
        com.axonrh.timesheet.entity.WorkSchedule workSchedule = null;
        if (employee != null && employee.getWorkScheduleId() != null) {
            try {
                workSchedule = dailySummaryService.getWorkSchedule(tenantId, employee.getWorkScheduleId());
            } catch (Exception e) {
                log.warn("Erro ao buscar escala local para exportacao: {}", e.getMessage());
            }
        }

        String employeeName = employee != null ? employee.getFullName() : getEmployeeName(tenantId, employeeId);
        String html = generateHtmlContent(List.of(new ExportData(employeeId, employeeName, employee, timesheet, totals, workSchedule)), startDate, endDate, company);
        
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
                
                com.axonrh.timesheet.entity.WorkSchedule workSchedule = null;
                if (employee != null && employee.getWorkScheduleId() != null) {
                    try {
                        workSchedule = dailySummaryService.getWorkSchedule(tenantId, employee.getWorkScheduleId());
                    } catch (Exception e) {}
                }

                return new ExportData(id, employee != null ? employee.getFullName() : getEmployeeName(tenantId, id), employee, timesheet, totals, workSchedule);
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
            String[] columns = {"Data", "Marcações", "Entrada", "I. Início", "I. Fim", "Saída", "Faltas", "Extras", "Adic. Not.", "Saldo", "Ocorrência"};
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
                row.createCell(8).setCellValue(day.getNightShiftFormatted());
                row.createCell(9).setCellValue((Boolean.TRUE.equals(day.getIsPositive()) ? "+" : "-") + day.getBalanceFormatted());
                
                String ocr = "OK";
                if (Boolean.TRUE.equals(day.getIsAbsent())) ocr = "Falta";
                else if (day.getHasMissingRecords() != null && day.getHasMissingRecords()) ocr = "Inc.";
                
                row.createCell(10).setCellValue(ocr);

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

    private record ExportData(UUID id, String name, com.axonrh.timesheet.dto.EmployeeDTO employee, List<DailySummaryResponse> timesheet, DailySummaryService.PeriodTotals totals, com.axonrh.timesheet.entity.WorkSchedule workSchedule) {}

    private String generateHtmlContent(List<ExportData> dataList, LocalDate startDate, LocalDate endDate, com.axonrh.timesheet.client.CoreServiceClient.CompanyProfileDTO company) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        ConfigServiceClient.ThemeConfigResponse theme = null;
        String logoUrl = null;
        String logoDataUri = null;
        
        try {
            theme = configServiceClient.getThemeConfig(tenantId);
            if (theme != null && theme.getLogoUrl() != null) {
                logoUrl = theme.getLogoUrl();
                log.info("Tentando buscar logo para PDF. URL: {}", logoUrl);

                // Regex para extrair Tenant ID e Filename da URL interna do logo
                // Suporta /logos/{uuid}/{filename}
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(".*/logos/([0-9a-fA-F-]+)/(.+)");
                java.util.regex.Matcher matcher = pattern.matcher(logoUrl);

                if (matcher.find()) {
                    String tIdStr = matcher.group(1);
                    String filename = matcher.group(2);
                    log.info("Extraído do logo interno - Tenant: {}, Filename: {}", tIdStr, filename);

                    try {
                        UUID tId = UUID.fromString(tIdStr);
                        byte[] logoBytes = configServiceClient.getLogoBytes(tId, filename);
                        if (logoBytes != null && logoBytes.length > 0) {
                            String extension = filename.contains(".") ? filename.substring(filename.lastIndexOf(".") + 1).toLowerCase() : "png";
                            String mimeType = "image/" + (extension.equals("svg") ? "svg+xml" : extension);
                            if (extension.equals("jpg") || extension.equals("jpeg")) mimeType = "image/jpeg";
                            
                            logoDataUri = "data:" + mimeType + ";base64," + java.util.Base64.getEncoder().encodeToString(logoBytes);
                            log.info("Logo interno convertido com sucesso para Base64. Tamanho: {} bytes", logoBytes.length);
                        }
                    } catch (Exception tIdErr) {
                        log.error("Erro ao processar bytes do logo interno: {}", tIdErr.getMessage());
                    }
                } else {
                     // Caso seja uma URL externa (ex: Wikimedia, S3 público, etc), tente baixar e converter
                     log.info("URL do logo parece externa: {}. Tentando baixar (bypass SSL)...", logoUrl);
                     try {
                         // Criar um TrustManager que aceita todos os certificados
                         javax.net.ssl.TrustManager[] trustAllCerts = new javax.net.ssl.TrustManager[]{
                             new javax.net.ssl.X509TrustManager() {
                                 public java.security.cert.X509Certificate[] getAcceptedIssuers() { return null; }
                                 public void checkClientTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                                 public void checkServerTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                             }
                         };

                         // Instalar o all-trusting trust manager
                         javax.net.ssl.SSLContext sc = javax.net.ssl.SSLContext.getInstance("SSL");
                         sc.init(null, trustAllCerts, new java.security.SecureRandom());
                         javax.net.ssl.HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

                         // Criar connection e configurar bypass de HostnameVerifier também se necessário
                         java.net.URL url = new java.net.URL(logoUrl);
                         java.net.URLConnection conn = url.openConnection();
                         if (conn instanceof javax.net.ssl.HttpsURLConnection) {
                             ((javax.net.ssl.HttpsURLConnection) conn).setSSLSocketFactory(sc.getSocketFactory());
                             ((javax.net.ssl.HttpsURLConnection) conn).setHostnameVerifier((hostname, session) -> true);
                         }
                         
                         try (java.io.InputStream is = conn.getInputStream()) {
                             byte[] bytes = is.readAllBytes();
                             if (bytes.length > 0) {
                                  String extension = logoUrl.contains(".") ? logoUrl.substring(logoUrl.lastIndexOf(".") + 1).toLowerCase() : "png";
                                  // Tratar query params na extensao se houver
                                  if (extension.contains("?")) extension = extension.split("\\?")[0];
                                  
                                  String mimeType = "image/png"; // Default
                                  if (extension.equals("svg")) mimeType = "image/svg+xml";
                                  else if (extension.equals("jpg") || extension.equals("jpeg")) mimeType = "image/jpeg";
                                  
                                  logoDataUri = "data:" + mimeType + ";base64," + java.util.Base64.getEncoder().encodeToString(bytes);
                                  log.info("Logo externo baixado e convertido (SSL bypass). Tamanho: {} bytes", bytes.length);
                             }
                         }
                     } catch (Exception extErr) {
                         log.error("Falha ao baixar logo externo: {}", extErr.getMessage());
                     }
                }
            }
        } catch (Exception e) {
            log.error("Erro geral ao buscar logo do tema: {}", e.getMessage());
        }

        String primaryColor = (theme != null && theme.getPrimaryColor() != null) ? theme.getPrimaryColor() 
                              : (theme != null && theme.getTextPrimaryColor() != null) ? theme.getTextPrimaryColor() 
                              : "#FF8000";
        if (logoDataUri == null && logoUrl != null) logoDataUri = logoUrl;

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        sb.append("<link href='https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap' rel='stylesheet'>");
        sb.append("<style>");
        sb.append("body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 9px; line-height: 1.4; background: #fff; }");
        sb.append(".page { padding: 40px; page-break-after: always; position: relative; }");
        
        // Header
        sb.append(".header-container { display: table; width: 100%; border-bottom: 2px solid ").append(primaryColor).append("; padding-bottom: 20px; margin-bottom: 20px; }");
        sb.append(".logo-column { display: table-cell; vertical-align: middle; width: 200px; }");
        sb.append(".title-column { display: table-cell; vertical-align: middle; text-align: right; }");
        sb.append(".main-title { font-size: 20px; font-weight: 800; color: ").append(primaryColor).append("; margin: 0; text-transform: uppercase; }");
        sb.append(".trade-name { font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 5px; }");
        sb.append(".period-label { font-size: 11px; color: #64748b; font-weight: 600; }");
        
        // Info Boxes
        sb.append(".info-section { width: 100%; margin-bottom: 12px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; table-layout: fixed; border-collapse: collapse; }");
        sb.append(".info-row { display: table; width: 100%; table-layout: fixed; }");
        sb.append(".info-item { display: table-cell; padding: 6px 10px; border-right: 1px solid #e2e8f0; vertical-align: top; }");
        sb.append(".info-item:last-child { border-right: none; }");
        sb.append(".label { font-size: 6.5px; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; }");
        sb.append(".value { font-size: 9px; font-weight: 600; color: #0f172a; display: block; }");
        sb.append(".bg-light { background-color: #f8fafc; }");

        // Contract Box
        sb.append(".contract-info { background: #fff; border: 1px solid #e2e8f0; border-left: 4px solid ").append(primaryColor).append("; padding: 10px; margin-bottom: 15px; border-radius: 4px; }");
        sb.append(".contract-grid { display: table; width: 100%; table-layout: fixed; }");
        sb.append(".contract-item { display: table-cell; }");
        sb.append(".contract-title { font-weight: 800; color: ").append(primaryColor).append("; font-size: 9px; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }");

        // Main Table
        sb.append("table.main-table { width: 100%; border-collapse: collapse; margin-top: 5px; border: 1px solid #e2e8f0; }");
        sb.append("table.main-table th { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 4px; font-size: 7.5px; text-transform: uppercase; color: #475569; font-weight: 800; text-align: center; }");
        sb.append("table.main-table td { border: 1px solid #f1f5f9; padding: 5px 3px; text-align: center; font-size: 8.5px; color: #334155; }");
        sb.append("table.main-table tr:nth-child(even) { background-color: #fafbfc; }");
        sb.append(".col-date { font-weight: 700; color: #1e293b; background-color: #f8fafc; }");
        sb.append(".punches-box { font-family: 'Courier New', monospace; font-weight: 600; color: #0f172a; text-align: left !important; padding-left: 8px !important; letter-spacing: 0.5px; font-size: 9px; }");
        sb.append(".weekend { color: #94a3b8; }");
        sb.append(".holiday-row { background-color: #fffbeb !important; color: #92400e; font-weight: 600; }");
        sb.append(".absent-row { background-color: #fef2f2 !important; color: #991b1b; font-weight: 600; }");
        sb.append(".status-ok { color: #16a34a; font-weight: 700; }");
        sb.append(".status-warning { color: #ca8a04; font-weight: 700; }");
        sb.append(".status-error { color: #dc2626; font-weight: 700; }");
        
        // Summary box
        sb.append(".summary-container { margin-top: 15px; display: table; width: 100%; table-layout: fixed; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }");
        sb.append(".summary-item { display: table-cell; padding: 10px; text-align: center; border-right: 1px solid #e2e8f0; background: #f8fafc; }");
        sb.append(".summary-item:last-child { border-right: none; }");
        sb.append(".summary-value { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 4px; display: block; }");
        
        // Signatures
        sb.append(".signature-section { margin-top: 40px; display: table; width: 100%; table-layout: fixed; }");
        sb.append(".signature-box { display: table-cell; width: 45%; text-align: center; padding: 20px 10px 0 10px; }");
        sb.append(".signature-line { border-top: 1px solid #94a3b8; margin-bottom: 8px; }");
        sb.append(".signature-label { font-size: 8px; color: #64748b; font-weight: 600; }");
        
        sb.append("</style></head><body>");

        for (ExportData data : dataList) {
            sb.append("<div class='page'>");
            
            // Header
            sb.append("<div class='header-container'>");
            sb.append("<div class='logo-column'>");
            if (logoDataUri != null) {
                sb.append("<img src='").append(logoDataUri).append("' style='max-height: 50px; max-width: 180px;' />");
            } else {
                sb.append("<div style='font-size: 24px; font-weight: 900; color:").append(primaryColor).append("'>Axon<span style='color:#1e293b'>RH</span></div>");
            }
            sb.append("</div>");
            sb.append("<div class='title-column'>");
            if (company != null && company.getTradeName() != null) {
                sb.append("<div class='trade-name'>").append(company.getTradeName()).append("</div>");
            }
            sb.append("<div class='main-title'>Espelho de Ponto</div>");
            sb.append("<div class='period-label'>Período: ")
              .append(startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
              .append(" a ")
              .append(endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
              .append("</div>");
            sb.append("</div>");
            sb.append("</div>");

            // Employer Info
            sb.append("<div class='info-section'>");
            sb.append("<div class='info-row'>");
            sb.append("<div class='info-item' style='width: 70%;'><span class='label'>Razão Social</span><span class='value'>").append(company != null ? company.getLegalName() : "Empresa não cadastrada").append("</span></div>");
            sb.append("<div class='info-item'><span class='label'>CNPJ</span><span class='value'>").append(company != null && company.getCnpj() != null ? formatCnpj(company.getCnpj()) : "-").append("</span></div>");
            sb.append("</div>");
            sb.append("<div class='info-row bg-light'>");
            sb.append("<div class='info-item' style='width: 70%;'><span class='label'>Endereço</span><span class='value'>").append(company != null && company.getFullAddress() != null ? company.getFullAddress() : "-").append("</span></div>");
            sb.append("<div class='info-item'><span class='label'>Cidade/UF</span><span class='value'>").append(company != null && company.getAddressCity() != null ? company.getAddressCity() + "/" + company.getAddressState() : "-").append("</span></div>");
            sb.append("</div>");
            sb.append("</div>");

            // Employee Info
            sb.append("<div class='info-section'>");
            sb.append("<div class='info-row'>");
            sb.append("<div class='info-item' style='width: 50%;'><span class='label'>Nome do Colaborador</span><span class='value'>").append(data.name()).append("</span></div>");
            sb.append("<div class='info-item'><span class='label'>Matrícula</span><span class='value'>").append(data.employee() != null ? getString(data.employee().getRegistrationNumber()) : "-").append("</span></div>");
            sb.append("<div class='info-item'><span class='label'>CPF</span><span class='value'>").append(data.employee() != null ? getString(data.employee().getCpf()) : "-").append("</span></div>");
            sb.append("</div>");
            sb.append("<div class='info-row bg-light'>");
            sb.append("<div class='info-item'><span class='label'>PIS/PASEP</span><span class='value'>").append(data.employee() != null ? getString(data.employee().getPisPasep()) : "-").append("</span></div>");
            sb.append("<div class='info-item'><span class='label'>Data de Admissão</span><span class='value'>").append(data.employee() != null && data.employee().getHireDate() != null ? data.employee().getHireDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-").append("</span></div>");
            sb.append("<div class='info-item' style='width: 40%;'><span class='label'>Cargo/Departamento</span><span class='value'>").append(data.employee() != null && data.employee().getDepartment() != null ? data.employee().getDepartment().getName() : "-").append("</span></div>");
            sb.append("</div>");
            sb.append("</div>");

            // Work Schedule
            sb.append("<div class='contract-info'>");
            sb.append("<div class='contract-title'>Escala: ").append(data.workSchedule() != null ? data.workSchedule().getName() : "Não informada").append("</div>");
            sb.append("<div class='contract-grid'>");
            com.axonrh.timesheet.entity.ScheduleDay daySpec = null;
            if (data.workSchedule() != null && data.workSchedule().getScheduleDays() != null) {
                daySpec = data.workSchedule().getScheduleDays().stream().filter(d -> Boolean.TRUE.equals(d.getIsWorkDay())).findFirst().orElse(null);
            }
            if (daySpec != null) {
                sb.append("<div class='contract-item'><span class='label'>Entrada</span><span class='value'>").append(formatTime(daySpec.getEntryTime())).append("</span></div>");
                sb.append("<div class='contract-item'><span class='label'>I. Almoço</span><span class='value'>").append(formatTime(daySpec.getBreakStartTime())).append(" a ").append(formatTime(daySpec.getBreakEndTime())).append("</span></div>");
                sb.append("<div class='contract-item'><span class='label'>Saída</span><span class='value'>").append(formatTime(daySpec.getExitTime())).append("</span></div>");
                sb.append("<div class='contract-item'><span class='label'>Carga Diária</span><span class='value'>").append(formatMinutes(daySpec.getExpectedWorkMinutes())).append("</span></div>");
            } else {
                sb.append("<div style='text-align: center; width: 100%; color: #94a3b8;'>Horários conforme escala de trabalho.</div>");
            }
            sb.append("</div>");
            sb.append("</div>");

            // Main Table
            sb.append("<table class='main-table'><thead>");
            sb.append("<tr>");
            sb.append("<th rowspan='2' width='10%'>Data</th>");
            sb.append("<th rowspan='2' width='35%'>Registros Efetuados</th>");
            sb.append("<th colspan='4'>Resumo Diário</th>");
            sb.append("<th rowspan='2' width='10%'>Saldo</th>");
            sb.append("<th rowspan='2' width='10%'>Ocorr.</th>");
            sb.append("</tr>");
            sb.append("<tr>");
            sb.append("<th width='7%'>Entra</th><th width='7%'>I. Sai</th><th width='7%'>I. Ent</th><th width='7%'>Saída</th>");
            sb.append("</tr>");
            sb.append("</thead><tbody>");

            for (DailySummaryResponse day : data.timesheet()) {
                String rowClass = "";
                if (day.getDayOfWeek().equals("Sábado") || day.getDayOfWeek().equals("Domingo")) rowClass = " class='weekend'";
                if (Boolean.TRUE.equals(day.getIsHoliday())) rowClass = " class='holiday-row'";
                if (Boolean.TRUE.equals(day.getIsAbsent())) rowClass = " class='absent-row'";

                sb.append("<tr").append(rowClass).append(">");
                sb.append("<td class='col-date'>").append(day.getSummaryDate().format(DateTimeFormatter.ofPattern("dd/MM"))).append("<br/><span style='font-size:6px; color:#64748b;'>").append(day.getDayOfWeek()).append("</span></td>");
                sb.append("<td class='punches-box'>").append(formatPunches(day.getRecords())).append("</td>");

                if (Boolean.TRUE.equals(day.getIsAbsent())) {
                    sb.append("<td colspan='4'>").append(day.getAbsenceType() != null ? day.getAbsenceType() : "FALTA").append("</td>");
                } else if (Boolean.TRUE.equals(day.getIsHoliday())) {
                    sb.append("<td colspan='4'>FERIADO: ").append(day.getHolidayName()).append("</td>");
                } else {
                    sb.append("<td>").append(formatTime(day.getFirstEntry())).append("</td>");
                    sb.append("<td>").append(formatTime(day.getBreakStart())).append("</td>");
                    sb.append("<td>").append(formatTime(day.getBreakEnd())).append("</td>");
                    sb.append("<td>").append(formatTime(day.getLastExit())).append("</td>");
                }

                int balanceValue = day.getBalanceMinutes() != null ? day.getBalanceMinutes() : 0;
                String balColor = balanceValue > 0 ? "status-ok" : (balanceValue < 0 ? "status-error" : "");
                String balanceStr = (balanceValue > 0 ? "+" : (balanceValue < 0 ? "-" : "")) + day.getBalanceFormatted();
                sb.append("<td class='").append(balColor).append("'>").append(balanceStr).append("</td>");
                
                String ocrShort = "OK";
                if (Boolean.TRUE.equals(day.getIsAbsent())) ocrShort = "FALTA";
                else if (Boolean.TRUE.equals(day.getHasMissingRecords())) ocrShort = "INC.";
                else if (balanceValue > 5) ocrShort = "EXT.";
                else if (balanceValue < -5) ocrShort = "DEB.";

                sb.append("<td style='font-weight:700;'>").append(ocrShort).append("</td>");
                sb.append("</tr>");
            }
            sb.append("</tbody></table>");

            // Totals
            sb.append("<div class='summary-container'>");
            sb.append("<div class='summary-item'><span class='label'>Horas Trabalhadas</span><span class='summary-value'>").append(data.totals() != null ? data.totals().workedFormatted() : "00:00").append("</span></div>");
            sb.append("<div class='summary-item'><span class='label'>Carga Esperada</span><span class='summary-value'>").append(calculateExpectedPeriod(data.timesheet())).append("</span></div>");
            sb.append("<div class='summary-item'><span class='label'>Horas Extras (+)</span><span class='summary-value status-ok'>").append(data.totals() != null ? data.totals().overtimeFormatted() : "00:00").append("</span></div>");
            sb.append("<div class='summary-item'><span class='label'>Débitos / Atrasos (-)</span><span class='summary-value status-error'>").append(data.totals() != null ? data.totals().deficitFormatted() : "00:00").append("</span></div>");
            sb.append("<div class='summary-item'><span class='label'>Adicional Noturno</span><span class='summary-value' style='color:#7c3aed;'>").append(data.totals() != null ? data.totals().nightShiftFormatted() : "00:00").append("</span></div>");
            
            int finalBalance = (data.totals() != null ? data.totals().overtimeMinutes() - data.totals().deficitMinutes() : 0);
            String finalBalStr = (finalBalance >= 0 ? "+" : "-") + formatMinutes(Math.abs(finalBalance));
            String bgRgba = hexToRgba(primaryColor, 0.1);
            sb.append("<div class='summary-item' style='background: ").append(bgRgba).append(";'><span class='label' style='color:").append(primaryColor).append("'>Saldo Final</span><span class='summary-value' style='color:").append(primaryColor).append("'>").append(finalBalStr).append("</span></div>");
            sb.append("</div>");


            // Signatures
            sb.append("<div class='signature-section'>");
            sb.append("<div class='signature-box'><div class='signature-line'></div><div class='signature-label'>ASSINATURA DO COLABORADOR</div><div style='font-size:7px; margin-top:4px;'>").append(data.name()).append("</div></div>");
            sb.append("<div class='signature-box'><div class='signature-line'></div><div class='signature-label'>").append(company != null ? company.getLegalName().toUpperCase() : "RESPONSÁVEL / RH").append("</div><div style='font-size:7px; margin-top:4px;'>CNPJ: ").append(company != null ? formatCnpj(company.getCnpj()) : "-").append("</div></div>");
            sb.append("</div>");

            // Footer
            sb.append("<div style='position:absolute; bottom:40px; left:40px; right:40px; display:table; width:100%; border-top:1px solid #f1f5f9; padding-top:10px; color:#94a3b8; font-size:7px;'>");
            sb.append("<div style='display:table-cell;'>Emitido via <strong>AxonRH</strong> em ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("</div>");
            sb.append("<div style='display:table-cell; text-align:right;'>Documento oficial de controle de jornada eletrônica.</div>");
            sb.append("</div>");
            sb.append("</div>");
        }

        sb.append("</body></html>");
        return sb.toString();
    }

    private String formatMinutes(Integer minutes) {
        if (minutes == null || minutes == 0) return "00:00";
        int hours = Math.abs(minutes) / 60;
        int mins = Math.abs(minutes) % 60;
        return String.format("%02d:%02d", hours, mins);
    }

    private String calculateExpectedPeriod(List<DailySummaryResponse> timesheet) {
        int total = timesheet.stream()
                .mapToInt(d -> d.getExpectedWorkMinutes() != null ? d.getExpectedWorkMinutes() : 0)
                .sum();
        return formatMinutes(total);
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

    private String hexToRgba(String hex, double alpha) {
        if (hex == null) return "rgba(0,0,0," + alpha + ")";
        if (!hex.startsWith("#") && !hex.startsWith("0x")) hex = "#" + hex;
        try {
            Color c = Color.decode(hex);
            return String.format(java.util.Locale.US, "rgba(%d, %d, %d, %.2f)", c.getRed(), c.getGreen(), c.getBlue(), alpha);
        } catch (Exception e) {
            // Fallback: Slate 200
            return "rgba(226, 232, 240, " + alpha + ")";
        }
    }
}
