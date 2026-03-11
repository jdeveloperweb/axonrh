package com.axonrh.employee.service;

import com.axonrh.employee.entity.Department;
import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.entity.Position;
import com.axonrh.employee.entity.enums.*;
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
                "CPF *", "Nome Completo *", "Nome Social", "E-mail Corporativo *", "E-mail Pessoal", 
                "Data Nascimento (dd/mm/aaaa) *", "Gênero (MASCULINO/FEMININO/OUTRO)", 
                "Estado Civil (SOLTEIRO/CASADO/DIVORCIADO/VIUVO/UNIAO_ESTAVEL)", 
                "Raça (BRANCO/PRETO/PARDO/AMARELO/INDIGENA)", "Nacionalidade", 
                "Cidade Nascimento", "UF Nascimento", "Nome da Mãe", "Nome do Pai", 
                "RG", "RG Emissor", "RG UF", "PIS/PASEP", 
                "CTPS", "CTPS Série", "CTPS UF", "Título Eleitor", 
                "Celular", "Telefone", "Logradouro", "Número", "Complemento", "Bairro", "Cidade", "UF", "CEP", 
                "Data Admissão (dd/mm/aaaa) *", "Cargo *", "Departamento *", 
                "Tipo Vinculo (CLT/PJ/ESTAGIARIO/APRENDIZ)", "Salário Base *", 
                "Banco", "Agência", "Conta", "Tipo Conta (CORRENTE/POUPANCA)", "Chave PIX"
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
            Row ex = sheet.createRow(1);
            ex.createCell(0).setCellValue("123.456.789-01");
            ex.createCell(1).setCellValue("João da Silva Oliveira");
            ex.createCell(2).setCellValue("");
            ex.createCell(3).setCellValue("joao.oliveira@empresa.com");
            ex.createCell(4).setCellValue("joao.silva@gmail.com");
            ex.createCell(5).setCellValue("15/05/1988");
            ex.createCell(6).setCellValue("MASCULINO");
            ex.createCell(7).setCellValue("CASADO");
            ex.createCell(8).setCellValue("PARDO");
            ex.createCell(9).setCellValue("Brasileira");
            ex.createCell(10).setCellValue("São Paulo");
            ex.createCell(11).setCellValue("SP");
            ex.createCell(12).setCellValue("Maria da Silva Oliveira");
            ex.createCell(13).setCellValue("José de Oliveira");
            ex.createCell(14).setCellValue("12.345.678-9");
            ex.createCell(15).setCellValue("SSP");
            ex.createCell(16).setCellValue("SP");
            ex.createCell(17).setCellValue("123.456.789-00");
            ex.createCell(18).setCellValue("1234567");
            ex.createCell(19).setCellValue("001-0");
            ex.createCell(20).setCellValue("SP");
            ex.createCell(21).setCellValue("1234567890");
            ex.createCell(22).setCellValue("(11) 98888-7777");
            ex.createCell(23).setCellValue("(11) 3333-2222");
            ex.createCell(24).setCellValue("Avenida Paulista");
            ex.createCell(25).setCellValue("1000");
            ex.createCell(26).setCellValue("Apto 12");
            ex.createCell(27).setCellValue("Bela Vista");
            ex.createCell(28).setCellValue("São Paulo");
            ex.createCell(29).setCellValue("SP");
            ex.createCell(30).setCellValue("01310-100");
            ex.createCell(31).setCellValue("01/03/2024");
            ex.createCell(32).setCellValue("Analista de RH Sênior");
            ex.createCell(33).setCellValue("Recursos Humanos");
            ex.createCell(34).setCellValue("CLT");
            ex.createCell(35).setCellValue(6500.00);
            ex.createCell(36).setCellValue("Itaú");
            ex.createCell(37).setCellValue("0001");
            ex.createCell(38).setCellValue("12345-6");
            ex.createCell(39).setCellValue("CORRENTE");
            ex.createCell(40).setCellValue("12345678901");

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
                    String cpf = getCellValueAsString(row.getCell(0));
                    String fullName = getCellValueAsString(row.getCell(1));
                    if (cpf == null || fullName == null) continue;

                    Employee employee = Employee.builder()
                        .tenantId(tenantId)
                        .cpf(cpf.replaceAll("\\D", ""))
                        .fullName(fullName)
                        .socialName(getCellValueAsString(row.getCell(2)))
                        .email(getCellValueAsString(row.getCell(3)))
                        .personalEmail(getCellValueAsString(row.getCell(4)))
                        .birthDate(getCellValueAsDate(row.getCell(5)))
                        .gender(parseGender(getCellValueAsString(row.getCell(6))))
                        .maritalStatus(parseMaritalStatus(getCellValueAsString(row.getCell(7))))
                        .race(parseRace(getCellValueAsString(row.getCell(8))))
                        .nationality(getCellValueAsString(row.getCell(9)) != null ? getCellValueAsString(row.getCell(9)) : "Brasileira")
                        .birthCity(getCellValueAsString(row.getCell(10)))
                        .birthState(getCellValueAsString(row.getCell(11)))
                        .motherName(getCellValueAsString(row.getCell(12)))
                        .fatherName(getCellValueAsString(row.getCell(13)))
                        .rgNumber(getCellValueAsString(row.getCell(14)))
                        .rgIssuer(getCellValueAsString(row.getCell(15)))
                        .rgState(getCellValueAsString(row.getCell(16)))
                        .pisPasep(getCellValueAsString(row.getCell(17)))
                        .ctpsNumber(getCellValueAsString(row.getCell(18)))
                        .ctpsSeries(getCellValueAsString(row.getCell(19)))
                        .ctpsState(getCellValueAsString(row.getCell(20)))
                        .voterTitle(getCellValueAsString(row.getCell(21)))
                        .mobile(getCellValueAsString(row.getCell(22)))
                        .phone(getCellValueAsString(row.getCell(23)))
                        .addressStreet(getCellValueAsString(row.getCell(24)))
                        .addressNumber(getCellValueAsString(row.getCell(25)))
                        .addressComplement(getCellValueAsString(row.getCell(26)))
                        .addressNeighborhood(getCellValueAsString(row.getCell(27)))
                        .addressCity(getCellValueAsString(row.getCell(28)))
                        .addressState(getCellValueAsString(row.getCell(29)))
                        .addressZipCode(getCellValueAsString(row.getCell(30)))
                        .hireDate(getCellValueAsDate(row.getCell(31)) != null ? getCellValueAsDate(row.getCell(31)) : LocalDate.now())
                        .position(findOrCreatePosition(getCellValueAsString(row.getCell(32)), tenantId))
                        .department(findOrCreateDepartment(getCellValueAsString(row.getCell(33)), tenantId))
                        .employmentType(parseEmploymentType(getCellValueAsString(row.getCell(34))))
                        .baseSalary(getCellValueAsBigDecimal(row.getCell(35)))
                        .bankName(getCellValueAsString(row.getCell(36)))
                        .bankAgency(getCellValueAsString(row.getCell(37)))
                        .bankAccount(getCellValueAsString(row.getCell(38)))
                        .bankAccountType(parseBankAccountType(getCellValueAsString(row.getCell(39))))
                        .pixKey(getCellValueAsString(row.getCell(40)))
                        .status(EmployeeStatus.ACTIVE)
                        .isActive(true)
                        .build();

                    if (employee.getBirthDate() == null) {
                        throw new IllegalArgumentException("Data de nascimento é obrigatória");
                    }
                    if (employee.getEmail() == null) {
                        throw new IllegalArgumentException("E-mail corporativo é obrigatório");
                    }

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
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue().trim();
        if (cell.getCellType() == CellType.NUMERIC) {
            return String.valueOf((long) cell.getNumericCellValue());
        }
        return null;
    }

    private LocalDate getCellValueAsDate(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        String val = getCellValueAsString(cell);
        if (val != null) {
            val = val.replaceAll("[^0-9/]", "");
            try {
                String[] parts = val.split("/");
                if (parts.length == 3) {
                    int day = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    int year = Integer.parseInt(parts[2]);
                    return LocalDate.of(year, month, day);
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
                return new BigDecimal(val.replace(".", "").replace(",", "."));
            } catch (Exception e) {}
        }
        return BigDecimal.ZERO;
    }

    private Gender parseGender(String val) {
        if (val == null) return Gender.OTHER;
        String v = val.toUpperCase();
        if (v.contains("MASCULINO") || v.equals("M")) return Gender.MALE;
        if (v.contains("FEMININO") || v.equals("F")) return Gender.FEMALE;
        return Gender.OTHER;
    }

    private MaritalStatus parseMaritalStatus(String val) {
        if (val == null) return MaritalStatus.SINGLE;
        String v = val.toUpperCase();
        if (v.contains("SOLTEIRO")) return MaritalStatus.SINGLE;
        if (v.contains("CASADO")) return MaritalStatus.MARRIED;
        if (v.contains("DIVORCIADO")) return MaritalStatus.DIVORCED;
        if (v.contains("VIUVO")) return MaritalStatus.WIDOWED;
        if (v.contains("UNIAO") || v.contains("ESTAVEL")) return MaritalStatus.STABLE_UNION;
        return MaritalStatus.SINGLE;
    }

    private Race parseRace(String val) {
        if (val == null) return Race.NAO_INFORMADO;
        String v = val.toUpperCase();
        if (v.contains("BRANCO")) return Race.BRANCO;
        if (v.contains("PRETO")) return Race.PRETO;
        if (v.contains("PARDO")) return Race.PARDO;
        if (v.contains("AMARELO")) return Race.AMARELO;
        if (v.contains("INDIGENA")) return Race.INDIGENA;
        return Race.NAO_INFORMADO;
    }

    private EmploymentType parseEmploymentType(String val) {
        if (val == null) return EmploymentType.CLT;
        String v = val.toUpperCase();
        if (v.contains("PJ")) return EmploymentType.PJ;
        if (v.contains("ESTAGI")) return EmploymentType.ESTAGIARIO;
        if (v.contains("APRENDIZ")) return EmploymentType.APRENDIZ;
        return EmploymentType.CLT;
    }

    private BankAccountType parseBankAccountType(String val) {
        if (val == null) return BankAccountType.CHECKING;
        String v = val.toUpperCase();
        if (v.contains("POUPANCA")) return BankAccountType.SAVINGS;
        return BankAccountType.CHECKING;
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
