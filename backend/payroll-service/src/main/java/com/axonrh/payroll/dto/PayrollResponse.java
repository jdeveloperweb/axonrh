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
    
    @com.fasterxml.jackson.annotation.JsonProperty("month")
    private Integer referenceMonth;
    
    @com.fasterxml.jackson.annotation.JsonProperty("year")
    private Integer referenceYear;

    private PayrollStatus status;
    private BigDecimal baseSalary;
    private BigDecimal totalEarnings;
    private BigDecimal totalDeductions;
    
    @com.fasterxml.jackson.annotation.JsonProperty("netValue")
    private BigDecimal netSalary;
    
    @com.fasterxml.jackson.annotation.JsonProperty("fgtsValue")
    private BigDecimal fgtsAmount;

    private Integer calculationVersion;
    private String notes;
    private List<PayrollItemResponse> items;
    
    @com.fasterxml.jackson.annotation.JsonProperty("calculatedAt")
    private LocalDateTime updatedAt;
    
    private LocalDateTime createdAt;
    
    // Getters para compatibilidade interna se necessario
    public BigDecimal getNetSalary() { return netSalary; }
    public BigDecimal getFgtsAmount() { return fgtsAmount; }
    public Integer getReferenceMonth() { return referenceMonth; }
    public Integer getReferenceYear() { return referenceYear; }
}
