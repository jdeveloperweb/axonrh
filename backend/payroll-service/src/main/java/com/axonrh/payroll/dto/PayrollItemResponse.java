package com.axonrh.payroll.dto;

import com.axonrh.payroll.enums.PayrollItemCode;
import com.axonrh.payroll.enums.PayrollItemType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollItemResponse implements java.io.Serializable {
    private static final long serialVersionUID = 1L;

    private UUID id;
    private PayrollItemType type;
    private PayrollItemCode code;
    
    @com.fasterxml.jackson.annotation.JsonProperty("name")
    private String description;
    
    @com.fasterxml.jackson.annotation.JsonProperty("baseValue")
    private BigDecimal referenceValue;

    private BigDecimal quantity;
    
    @com.fasterxml.jackson.annotation.JsonProperty("multiplier")
    private BigDecimal percentage;
    
    @com.fasterxml.jackson.annotation.JsonProperty("calculatedValue")
    private BigDecimal amount;

    private Integer sortOrder;
    
    // Getters auxiliares para facilitar no Java se necessario
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
