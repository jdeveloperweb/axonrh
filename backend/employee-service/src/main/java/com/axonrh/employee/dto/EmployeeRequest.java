package com.axonrh.employee.dto;

import com.axonrh.employee.entity.enums.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO de requisicao para criar/atualizar colaborador.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeRequest {

    // ==================== Dados Pessoais ====================

    private String registrationNumber;

    @NotBlank(message = "CPF e obrigatorio")
    @Pattern(regexp = "\\d{11}", message = "CPF deve conter 11 digitos")
    private String cpf;

    @NotBlank(message = "Nome completo e obrigatorio")
    @Size(min = 3, max = 200, message = "Nome deve ter entre 3 e 200 caracteres")
    private String fullName;

    @Size(max = 200)
    private String socialName;

    @NotNull(message = "Data de nascimento e obrigatoria")
    @Past(message = "Data de nascimento deve ser no passado")
    private LocalDate birthDate;

    private Gender gender;
    private Ethnicity ethnicity;
    private Race race;
    private MaritalStatus maritalStatus;
    private String nationality;
    private String birthCity;

    @Size(max = 2)
    private String birthState;

    private String motherName;
    private String fatherName;

    // ==================== Documentos ====================

    private String rgNumber;
    private String rgIssuer;
    private String rgState;
    private LocalDate rgIssueDate;
    private String pisPasep;
    private String ctpsNumber;
    private String ctpsSeries;
    private String ctpsState;
    private LocalDate ctpsIssueDate;
    private String voterTitle;
    private String voterZone;
    private String voterSection;
    private String militaryCertificate;
    private String driverLicense;
    private String driverLicenseCategory;
    private LocalDate driverLicenseExpiry;

    // ==================== Contato ====================

    @NotBlank(message = "Email e obrigatorio")
    @Email(message = "Email invalido")
    private String email;

    @Email
    private String personalEmail;

    @Pattern(regexp = "\\d{10,11}", message = "Telefone invalido")
    private String phone;

    @Pattern(regexp = "\\d{10,11}", message = "Celular invalido")
    private String mobile;

    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;

    // ==================== Endereco ====================

    private String addressStreet;
    private String addressNumber;
    private String addressComplement;
    private String addressNeighborhood;
    private String addressCity;

    @Size(max = 2)
    private String addressState;

    @Pattern(regexp = "\\d{8}", message = "CEP deve conter 8 digitos")
    private String addressZipCode;

    private String addressCountry;

    // ==================== Dados Profissionais ====================

    private UUID departmentId;
    private UUID positionId;
    private UUID costCenterId;
    private UUID managerId;

    @NotNull(message = "Data de admissao e obrigatoria")
    private LocalDate hireDate;

    @NotNull(message = "Tipo de contrato e obrigatorio")
    private EmploymentType employmentType;

    private WorkRegime workRegime;

    private List<String> hybridWorkDays;

    private Integer hybridFrequency;

    @Min(1)
    @Max(44)
    private Integer weeklyHours;

    private String shift;

    // ==================== Dados Bancarios ====================

    private String bankCode;
    private String bankName;
    private String bankAgency;
    private String bankAgencyDigit;
    private String bankAccount;
    private String bankAccountDigit;
    private BankAccountType bankAccountType;
    private String pixKey;
    private PixKeyType pixKeyType;

    // ==================== Salario ====================

    @DecimalMin(value = "0.01", message = "Salario deve ser maior que zero")
    private BigDecimal baseSalary;

    private SalaryType salaryType;

    // ==================== Relacionamentos ====================

    private List<EmployeeDependentRequest> dependents;
}
