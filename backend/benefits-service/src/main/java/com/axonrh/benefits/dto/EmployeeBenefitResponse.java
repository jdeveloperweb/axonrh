package com.axonrh.benefits.dto;

import com.axonrh.benefits.enums.BenefitCategory;
import com.axonrh.benefits.enums.CalculationType;
import com.axonrh.benefits.enums.EmployeeBenefitStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeBenefitResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID benefitTypeId;
    private String benefitTypeName;
    private BenefitCategory benefitCategory;
    private CalculationType calculationType;
    private BigDecimal fixedValue;
    private BigDecimal percentage;
    private LocalDate startDate;
    private LocalDate endDate;
    private EmployeeBenefitStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
