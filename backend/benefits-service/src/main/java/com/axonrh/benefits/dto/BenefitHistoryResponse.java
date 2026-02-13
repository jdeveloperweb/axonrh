package com.axonrh.benefits.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenefitHistoryResponse {

    private UUID id;
    private UUID employeeId;
    private UUID employeeBenefitId;
    private String benefitTypeName;
    private String action;
    private BigDecimal oldValue;
    private BigDecimal newValue;
    private BigDecimal oldPercentage;
    private BigDecimal newPercentage;
    private String oldStatus;
    private String newStatus;
    private String notes;
    private LocalDateTime changedAt;
    private UUID changedBy;
}
