package com.axonrh.vacation.service;

import com.axonrh.vacation.dto.VacationSimulationRequest;
import com.axonrh.vacation.dto.VacationSimulationResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class VacationCalculationService {

    public VacationSimulationResponse simulate(VacationSimulationRequest request) {
        BigDecimal baseSalary = defaultValue(request.getBaseSalary());
        int vacationDays = defaultInt(request.getVacationDays(), 0);
        int sellDays = defaultInt(request.getSellDays(), 0);

        BigDecimal dailyRate = baseSalary.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
        BigDecimal vacationSalary = dailyRate.multiply(BigDecimal.valueOf(vacationDays));
        BigDecimal vacationBonus = vacationSalary.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
        BigDecimal sellValue = dailyRate.multiply(BigDecimal.valueOf(sellDays));
        BigDecimal salary13th = request.isAdvance13th()
                ? baseSalary.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal grossTotal = vacationSalary.add(vacationBonus).add(sellValue).add(salary13th);

        return VacationSimulationResponse.builder()
                .baseSalary(baseSalary)
                .vacationDays(vacationDays)
                .sellDays(sellDays)
                .advance13th(request.isAdvance13th())
                .vacationSalary(vacationSalary)
                .vacationBonus(vacationBonus)
                .sellValue(sellValue)
                .salary13th(salary13th)
                .grossTotal(grossTotal)
                .inssDeduction(BigDecimal.ZERO)
                .irrfDeduction(BigDecimal.ZERO)
                .netTotal(grossTotal)
                .build();
    }

    private BigDecimal defaultValue(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private int defaultInt(Integer value, int fallback) {
        return value != null ? value : fallback;
    }
}
