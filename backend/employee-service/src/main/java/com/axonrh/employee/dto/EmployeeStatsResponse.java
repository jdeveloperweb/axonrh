package com.axonrh.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeStatsResponse {
    private long total;
    private long active;
    private long onLeave;
    private long terminated;
    private long pending;
    
    // Regimes
    private long presencial;
    private long remoto;
    private long hibrido;
    
    // Análise
    private BigDecimal totalMonthlySalary;
    private BigDecimal averageSalary;
    
    private Map<String, Long> byDepartment;
}
