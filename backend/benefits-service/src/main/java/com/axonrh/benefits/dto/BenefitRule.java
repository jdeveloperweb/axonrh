package com.axonrh.benefits.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BenefitRule implements Serializable {
    private static final long serialVersionUID = 1L;

    // For Transport Voucher: PERCENTAGE_OF_SALARY_WITH_CAP
    // For Health Plan: PER_BENEFICIARY_WITH_AGE_RULES
    private RuleType ruleType; 
    
    // Config for Transport Voucher
    private BigDecimal percentage; // e.g. 6.0 for 6%
    
    // Config for Health Plan
    private BigDecimal employeeFixedValue;   // Base cost for employee
    private BigDecimal dependentFixedValue;  // Base cost per dependent
    
    // Age Rules for Health Plan (overrides base costs)
    private List<AgeRule> ageRules;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgeRule implements Serializable {
        private Integer minAge;
        private Integer maxAge;
        private BigDecimal value; // Specific cost for this age range
        private boolean exempt;   // If true, cost is 0
    }

    public enum RuleType {
        STANDARD, // Use default logic (fixed or simple percentage)
        TRANSPORT_VOUCHER, // 6% salary cap logic
        HEALTH_PLAN // Age based logic
    }
}
