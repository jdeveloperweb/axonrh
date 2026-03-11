package com.axonrh.payroll.service;

import com.axonrh.payroll.client.EmployeeServiceClient;
import com.axonrh.payroll.dto.EmployeeDTO;
import com.axonrh.payroll.entity.Payroll;
import com.axonrh.payroll.enums.PayrollStatus;
import com.axonrh.payroll.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImportService {

    private final PayrollRepository payrollRepository;
    private final EmployeeServiceClient employeeClient;

    public byte[] generatePayrollTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Folha de Pagamento");

            Row headerRow = sheet.createRow(0);
            String[] columns = {
                "Matrícula", "Mês Referência (1-12)", "Ano Referência", 
                "Salário Base", "Total Proventos", "Total Descontos", "Salário Líquido"
            };

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
                sheet.autoSizeColumn(i);
            }

            // Exemplo
            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("12345");
            exampleRow.createCell(1).setCellValue(3);
            exampleRow.createCell(2).setCellValue(2024);
            exampleRow.createCell(3).setCellValue(5000.00);
            exampleRow.createCell(4).setCellValue(5200.00);
            exampleRow.createCell(5).setCellValue(800.00);
            exampleRow.createCell(6).setCellValue(4400.00);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional
    public Map<String, Object> importPayroll(MultipartFile file, UUID tenantId) throws IOException {
        int successCount = 0;
        int errorCount = 0;
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            // Skip header
            if (rows.hasNext()) rows.next();

            while (rows.hasNext()) {
                Row row = rows.next();
                try {
                    String registration = getCellValueAsString(row.getCell(0));
                    if (registration == null || registration.isBlank()) continue;

                    Integer month = getCellValueAsInteger(row.getCell(1));
                    Integer year = getCellValueAsInteger(row.getCell(2));
                    
                    if (month == null || year == null) {
                        throw new RuntimeException("Mês ou Ano de referência inválido");
                    }

                    BigDecimal baseSalary = getCellValueAsBigDecimal(row.getCell(3));
                    BigDecimal earnings = getCellValueAsBigDecimal(row.getCell(4));
                    BigDecimal deductions = getCellValueAsBigDecimal(row.getCell(5));
                    BigDecimal net = getCellValueAsBigDecimal(row.getCell(6));

                    // Buscar colaborador para obter ID e nome real
                    EmployeeDTO employee = null;
                    try {
                        employee = employeeClient.getEmployeeByRegistration(registration);
                    } catch (Exception e) {
                        log.warn("Colaborador com matrícula {} não encontrado no employee-service", registration);
                    }

                    Payroll payroll = Payroll.builder()
                            .tenantId(tenantId)
                            .employeeId(employee != null ? employee.getId() : UUID.randomUUID()) // Fallback se não achar
                            .employeeName(employee != null ? employee.getFullName() : "Importado (" + registration + ")")
                            .registrationNumber(registration)
                            .referenceMonth(month)
                            .referenceYear(year)
                            .status(PayrollStatus.PROCESSED)
                            .baseSalary(baseSalary)
                            .totalEarnings(earnings)
                            .totalDeductions(deductions)
                            .netSalary(net)
                            .fgtsAmount(baseSalary.multiply(new BigDecimal("0.08"))) // Estima FGTS
                            .build();

                    // Evita duplicados para o mesmo mês/ano/colaborador
                    Optional<Payroll> existing = payrollRepository.findByTenantIdAndEmployeeIdAndReferenceMonthAndReferenceYear(
                            tenantId, payroll.getEmployeeId(), month, year);
                    
                    if (existing.isPresent()) {
                        Payroll ex = existing.get();
                        ex.setBaseSalary(baseSalary);
                        ex.setTotalEarnings(earnings);
                        ex.setTotalDeductions(deductions);
                        ex.setNetSalary(net);
                        payrollRepository.save(ex);
                    } else {
                        payrollRepository.save(payroll);
                    }

                    successCount++;
                } catch (Exception e) {
                    errorCount++;
                    errors.add("Erro na linha " + (row.getRowNum() + 1) + ": " + e.getMessage());
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successCount);
        result.put("errorCount", errorCount);
        result.put("errors", errors);
        return result;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue();
        if (cell.getCellType() == CellType.NUMERIC) {
            return String.valueOf((long) cell.getNumericCellValue());
        }
        return null;
    }

    private Integer getCellValueAsInteger(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) cell.getNumericCellValue();
        }
        String val = getCellValueAsString(cell);
        if (val != null) {
            try {
                return Integer.parseInt(val.trim());
            } catch (Exception e) {}
        }
        return null;
    }

    private BigDecimal getCellValueAsBigDecimal(Cell cell) {
        if (cell == null) return BigDecimal.ZERO;
        if (cell.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        }
        String val = getCellValueAsString(cell);
        if (val != null) {
            try {
                return new BigDecimal(val.replace(",", "."));
            } catch (Exception e) {}
        }
        return BigDecimal.ZERO;
    }
}
