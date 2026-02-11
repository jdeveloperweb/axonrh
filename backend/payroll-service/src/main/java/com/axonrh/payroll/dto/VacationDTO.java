package com.axonrh.payroll.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class VacationDTO {
    private UUID id;
    private UUID employeeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalDays;
    private Boolean sellDays;
    private Integer soldDays;
    private BigDecimal vacationPay;
    private BigDecimal vacationBonus;
    private String status;
}
