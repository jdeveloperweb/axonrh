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
public class PayrollItemResponse {
    private UUID id;
    private PayrollItemType type;
    private PayrollItemCode code;
    private String description;
    private BigDecimal referenceValue;
    private BigDecimal quantity;
    private BigDecimal percentage;
    private BigDecimal amount;
    private Integer sortOrder;
}
