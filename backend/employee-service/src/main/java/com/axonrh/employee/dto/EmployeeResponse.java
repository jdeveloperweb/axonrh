package com.axonrh.employee.dto;

import com.axonrh.employee.entity.enums.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.UUID;

/**
 * DTO de resposta de colaborador.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;
    private UUID tenantId;
    private UUID userId;

    // Dados Pessoais
    private String registrationNumber;
    private String cpf;
    private String fullName;
    private String socialName;
    private String displayName;
    private LocalDate birthDate;
    private Integer age;
    private Gender gender;
    private MaritalStatus maritalStatus;
    private Ethnicity ethnicity;
    private Race race;
    private String nationality;
    private String birthCity;
    private String birthState;

    // Contato
    private String email;
    private String personalEmail;
    private String phone;
    private String mobile;

    // Endereco
    private AddressDto address;

    // Dados Profissionais
    private DepartmentSummary department;
    private PositionSummary position;
    private CostCenterSummary costCenter;
    private EmployeeSummary manager;
    private LocalDate hireDate;
    private LocalDate terminationDate;
    private EmploymentType employmentType;
    private WorkRegime workRegime;
    private List<String> hybridWorkDays;
    private Integer hybridFrequency;
    private Integer weeklyHours;
    private String shift;
    private UUID workScheduleId;
    private Integer yearsOfService;

    // Salario
    private BigDecimal baseSalary;
    private SalaryType salaryType;

    // Status
    private EmployeeStatus status;
    private String photoUrl;
    private Boolean isActive;

    // Relacionamentos
    private List<DependentSummary> dependents;
    private Integer documentCount;

    // Auditoria
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ==================== DTOs Aninhados ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddressDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private String street;
        private String number;
        private String complement;
        private String neighborhood;
        private String city;
        private String state;
        private String zipCode;
        private String country;
        private String fullAddress;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DepartmentSummary implements Serializable {
        private static final long serialVersionUID = 1L;
        private UUID id;
        private String code;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PositionSummary implements Serializable {
        private static final long serialVersionUID = 1L;
        private UUID id;
        private String code;
        private String title;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CostCenterSummary implements Serializable {
        private static final long serialVersionUID = 1L;
        private UUID id;
        private String code;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployeeSummary implements Serializable {
        private static final long serialVersionUID = 1L;
        private UUID id;
        private String name;
        private String email;
        private String photoUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DependentSummary implements Serializable {
        private static final long serialVersionUID = 1L;
        private UUID id;
        private String name;
        private String relationship;
        private LocalDate birthDate;
        private String cpf;
        @JsonProperty("isIRDependent")
        private Boolean isIRDependent;
        @JsonProperty("isHealthPlanDependent")
        private Boolean isHealthPlanDependent;
    }
}
