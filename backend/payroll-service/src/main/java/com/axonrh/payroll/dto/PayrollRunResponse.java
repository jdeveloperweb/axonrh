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
public class PayrollRunResponse implements java.io.Serializable {
    private static final long serialVersionUID = 1L;

    private UUID id;
    private Integer month;
    private Integer year;

    private String description;
    private PayrollRunStatus status;
    private Integer totalEmployees;
    private Integer processedEmployees;
    private Integer failedEmployees;
    private BigDecimal totalEarnings;
    private BigDecimal totalDeductions;
    
    // Campos alinhados com frontend
    private BigDecimal totalNetValue;
    private BigDecimal totalFgtsValue;
    
    // Getters para compatibilidade
    public BigDecimal getTotalNetSalary() { return totalNetValue; }
    public BigDecimal getTotalFgts() { return totalFgtsValue; }
    public Integer getReferenceMonth() { return month; }
    public Integer getReferenceYear() { return year; }

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
}
