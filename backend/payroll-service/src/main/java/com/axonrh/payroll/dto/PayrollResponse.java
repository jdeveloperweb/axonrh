package com.axonrh.payroll.dto;

import com.axonrh.payroll.enums.PayrollStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollResponse implements java.io.Serializable {
    private static final long serialVersionUID = 1L;

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String employeeCpf;
    private String registrationNumber;
    private String departmentName;
    private String positionName;
    
    private Integer month;
    private Integer year;

    private PayrollStatus status;
    private BigDecimal baseSalary;
    private BigDecimal totalEarnings;
    private BigDecimal totalDeductions;
    
    private BigDecimal netValue;
    private BigDecimal fgtsValue;

    private Integer calculationVersion;
    private String notes;
    private List<PayrollItemResponse> items;
    
    private LocalDateTime calculatedAt;
    private LocalDateTime createdAt;
    
    // Getters para compatibilidade interna se necessario
    public BigDecimal getNetSalary() { return netValue; }
    public BigDecimal getFgtsAmount() { return fgtsValue; }
    public Integer getReferenceMonth() { return month; }
    public Integer getReferenceYear() { return year; }
    public LocalDateTime getUpdatedAt() { return calculatedAt; }
}
