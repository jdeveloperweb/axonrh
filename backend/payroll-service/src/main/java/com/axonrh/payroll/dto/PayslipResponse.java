package com.axonrh.payroll.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayslipResponse {

    private String companyName;
    private String companyCnpj;

    private String employeeName;
    private String employeeCpf;
    private String department;
    private String position;
    private String referenceLabel;

    private BigDecimal baseSalary;

    private List<PayrollItemResponse> earnings;
    private List<PayrollItemResponse> deductions;

    private BigDecimal totalEarnings;
    private BigDecimal totalDeductions;
    private BigDecimal netSalary;

    private BigDecimal fgtsBase;
    private BigDecimal fgtsAmount;

    private BigDecimal inssBase;
    private BigDecimal inssAmount;

    private BigDecimal irrfBase;
    private BigDecimal irrfAmount;
}
