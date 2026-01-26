package com.axonrh.vacation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VacationSimulationResponse {

    private BigDecimal baseSalary;
    private Integer vacationDays;
    private Integer sellDays;
    private boolean advance13th;
    private BigDecimal vacationSalary;
    private BigDecimal vacationBonus;
    private BigDecimal sellValue;
    private BigDecimal salary13th;
    private BigDecimal grossTotal;
    private BigDecimal inssDeduction;
    private BigDecimal irrfDeduction;
    private BigDecimal netTotal;
}
