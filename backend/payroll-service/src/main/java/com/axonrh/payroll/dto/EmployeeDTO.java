package com.axonrh.payroll.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class EmployeeDTO {
    private UUID id;
    
    @JsonAlias({"fullName", "full_name"})
    private String fullName;
    
    @JsonAlias({"cpf"})
    private String cpf;
    
    @JsonAlias({"registrationNumber", "registration_number"})
    private String registrationNumber;
    
    private LocalDate hireDate;
    private String status;
    
    @JsonAlias({"baseSalary", "base_salary"})
    private BigDecimal baseSalary;
    
    private DepartmentDTO department;
    private PositionDTO position;

    @JsonAlias({"departmentName", "department_name"})
    private String departmentNameAlias;

    @JsonAlias({"positionName", "position_name", "positionTitle", "position_title", "title"})
    private String positionNameAlias;
    
    public String getDepartmentName() {
        if (departmentNameAlias != null && !departmentNameAlias.isBlank()) return departmentNameAlias;
        return department != null ? department.getName() : null;
    }
    
    public String getPositionName() {
        if (positionNameAlias != null && !positionNameAlias.isBlank()) return positionNameAlias;
        return position != null ? position.getTitle() : null;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DepartmentDTO {
        @JsonAlias({"name", "departmentName", "department_name"})
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PositionDTO {
        @JsonAlias({"title", "name", "positionName", "position_title"})
        private String title;
    }
    
    private Boolean hasTransportVoucher;
    private BigDecimal transportVoucherDiscount;
    private Boolean hasMealVoucher;
    private BigDecimal mealVoucherDiscount;
    private Boolean hasHealthInsurance;
    private BigDecimal healthInsuranceDiscount;
    private Integer dependentsCount;
}
