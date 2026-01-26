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
public class VacationSimulationRequest {

    private BigDecimal baseSalary;
    private Integer vacationDays;
    private Integer sellDays;
    private boolean advance13th;
}
