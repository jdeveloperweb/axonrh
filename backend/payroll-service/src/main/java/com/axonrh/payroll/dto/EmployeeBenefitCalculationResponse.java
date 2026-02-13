package com.axonrh.payroll.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeBenefitCalculationResponse {

    private UUID employeeId;
    private String employeeName;
    private Integer referenceMonth;
    private Integer referenceYear;
    private BigDecimal totalEarnings;
    private BigDecimal totalDeductions;
    private List<BenefitItem> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BenefitItem {
        private UUID benefitTypeId;
        private String benefitTypeName;
        private String category; // EARNING or DEDUCTION
        private String calculationType; // FIXED or PERCENTAGE
        private BigDecimal fixedValue;
        private BigDecimal percentage;
        private BigDecimal calculatedAmount;
    }
}
