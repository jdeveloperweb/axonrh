package com.axonrh.payroll.dto;

import com.axonrh.payroll.enums.PayrollRunStatus;
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
public class PayrollRunResponse {
    private UUID id;
    private Integer referenceMonth;
    private Integer referenceYear;
    private String description;
    private PayrollRunStatus status;
    private Integer totalEmployees;
    private Integer processedEmployees;
    private Integer failedEmployees;
    private BigDecimal totalEarnings;
    private BigDecimal totalDeductions;
    private BigDecimal totalNetSalary;
    private BigDecimal totalFgts;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
}
