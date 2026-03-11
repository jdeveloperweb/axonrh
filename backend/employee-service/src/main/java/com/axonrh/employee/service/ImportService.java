package com.axonrh.employee.service;

import com.axonrh.employee.entity.Department;
import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.entity.Position;
import com.axonrh.employee.entity.enums.EmployeeStatus;
import com.axonrh.employee.entity.enums.EmploymentType;
import com.axonrh.employee.entity.enums.Gender;
import com.axonrh.employee.repository.DepartmentRepository;
import com.axonrh.employee.repository.EmployeeRepository;
import com.axonrh.employee.repository.PositionRepository;
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
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImportService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;

    public byte[] generateEmployeeTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Colaboradores");

            Row headerRow = sheet.createRow(0);
            String[] columns = {
                "Matrícula", "CPF", "Nome Completo", "E-mail", 
                "Data Nascimento (dd/mm/aaaa)", "Gênero (MASCULINO/FEMININO)", 
                "Data Admissão (dd/mm/aaaa)", "Cargo", "Departamento", "Salário Base"
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
            exampleRow.createCell(1).setCellValue("12345678901");
            exampleRow.createCell(2).setCellValue("João da Silva");
            exampleRow.createCell(3).setCellValue("joao.silva@empresa.com");
            exampleRow.createCell(4).setCellValue("01/01/1990");
            exampleRow.createCell(5).setCellValue("MASCULINO");
            exampleRow.createCell(6).setCellValue("01/03/2024");
            exampleRow.createCell(7).setCellValue("Analista de RH");
            exampleRow.createCell(8).setCellValue("Recursos Humanos");
            exampleRow.createCell(9).setCellValue(5000.00);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional
    public Map<String, Object> importEmployees(MultipartFile file, UUID tenantId) throws IOException {
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
                    String cpf = getCellValueAsString(row.getCell(1));
                    String name = getCellValueAsString(row.getCell(2));
                    String email = getCellValueAsString(row.getCell(3));
                    
                    if (cpf == null || name == null || email == null) {
                        continue; // Skip empty rows
                    }

                    LocalDate birthDate = getCellValueAsDate(row.getCell(4));
                    String genderStr = getCellValueAsString(row.getCell(5));
                    LocalDate hireDate = getCellValueAsDate(row.getCell(6));
                    String positionName = getCellValueAsString(row.getCell(7));
                    String deptName = getCellValueAsString(row.getCell(8));
                    BigDecimal baseSalary = getCellValueAsBigDecimal(row.getCell(9));

                    // Lookup or create Department/Position
                    Department department = findOrCreateDepartment(deptName, tenantId);
                    Position position = findOrCreatePosition(positionName, tenantId);

                    Employee employee = Employee.builder()
                            .tenantId(tenantId)
                            .registrationNumber(registration)
                            .cpf(cpf.replaceAll("\\D", ""))
                            .fullName(name)
                            .email(email)
                            .birthDate(birthDate)
                            .gender(parseGender(genderStr))
                            .hireDate(hireDate != null ? hireDate : LocalDate.now())
                            .department(department)
                            .position(position)
                            .baseSalary(baseSalary)
                            .employmentType(EmploymentType.CLT) // Default
                            .status(EmployeeStatus.ACTIVE)
                            .isActive(true)
                            .build();

                    employeeRepository.save(employee);
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

    private LocalDate getCellValueAsDate(Cell cell) {
        if (cell == null) return null;
        if (DateUtil.isCellDateFormatted(cell)) {
            return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        String val = getCellValueAsString(cell);
        if (val != null) {
            // Tentativa simples de parse se vier como string
            try {
                String[] parts = val.split("/");
                if (parts.length == 3) {
                    return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[1]), Integer.parseInt(parts[0]));
                }
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

    private Gender parseGender(String val) {
        if (val == null) return Gender.OTHER;
        String upperVal = val.toUpperCase().trim();
        if (upperVal.equals("MASCULINO") || upperVal.equals("M")) return Gender.MALE;
        if (upperVal.equals("FEMININO") || upperVal.equals("F")) return Gender.FEMALE;
        
        try {
            return Gender.valueOf(upperVal);
        } catch (Exception e) {
            return Gender.OTHER;
        }
    }

    private Department findOrCreateDepartment(String name, UUID tenantId) {
        if (name == null || name.isBlank()) return null;
        String trimmedName = name.trim();
        return departmentRepository.findByTenantIdAndNameIgnoreCase(tenantId, trimmedName)
                .orElseGet(() -> departmentRepository.save(Department.builder()
                        .tenantId(tenantId)
                        .name(trimmedName)
                        .code(trimmedName.toUpperCase().replaceAll("[^A-Z0-9]", "_"))
                        .isActive(true)
                        .build()));
    }

    private Position findOrCreatePosition(String name, UUID tenantId) {
        if (name == null || name.isBlank()) return null;
        String trimmedName = name.trim();
        return positionRepository.findByTenantIdAndTitleIgnoreCase(tenantId, trimmedName)
                .orElseGet(() -> positionRepository.save(Position.builder()
                        .tenantId(tenantId)
                        .title(trimmedName)
                        .code(trimmedName.toUpperCase().replaceAll("[^A-Z0-9]", "_"))
                        .isActive(true)
                        .build()));
    }
}
