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
    private String departmentName;
    private String positionName;
    private Integer referenceMonth;
    private Integer referenceYear;
    
    // Alias para o frontend
    public Integer getMonth() { return referenceMonth; }
    public Integer getYear() { return referenceYear; }

    private PayrollStatus status;
    private BigDecimal baseSalary;
    private BigDecimal totalEarnings;
    private BigDecimal totalDeductions;
    
    // Campos alinhados com o frontend
    private BigDecimal netValue;
    private BigDecimal fgtsValue;
    
    // Mantendo originais para retrocompatibilidade interna se necessario
    public BigDecimal getNetSalary() { return netValue; }
    public void setNetSalary(BigDecimal val) { this.netValue = val; }
    public BigDecimal getFgtsAmount() { return fgtsValue; }
    public void setFgtsAmount(BigDecimal val) { this.fgtsValue = val; }

    private Integer calculationVersion;
    private String notes;
    private List<PayrollItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
