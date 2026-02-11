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
    private String fullName;
    private String cpf;
    private String registrationNumber;
    private LocalDate hireDate;
    private String status;
    private BigDecimal baseSalary;
    private String departmentName;
    private String positionName;
    private Boolean hasTransportVoucher;
    private BigDecimal transportVoucherDiscount;
    private Boolean hasMealVoucher;
    private BigDecimal mealVoucherDiscount;
    private Boolean hasHealthInsurance;
    private BigDecimal healthInsuranceDiscount;
    private Integer dependentsCount;
}
