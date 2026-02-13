package com.axonrh.payroll.service;

import com.axonrh.payroll.dto.*;
import com.axonrh.payroll.entity.Payroll;
import com.axonrh.payroll.entity.PayrollItem;
import com.axonrh.payroll.entity.TaxBracket;
import com.axonrh.payroll.enums.PayrollItemCode;
import com.axonrh.payroll.enums.PayrollItemType;
import com.axonrh.payroll.enums.PayrollStatus;
import com.axonrh.payroll.repository.TaxBracketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Motor de calculo de folha de pagamento.
 *
 * Fluxo de calculo:
 * 1. Buscar dados do colaborador (employee-service)
 * 2. Buscar horas trabalhadas (timesheet-service)
 * 3. Buscar ferias do periodo (vacation-service)
 * 4. Buscar bonus/comissao (performance-service)
 * 5. Calcular proventos (salario base, HE 50%, HE 100%, adicional noturno, bonus, ferias)
 * 6. Calcular INSS (faixas progressivas)
 * 7. Calcular IRRF (faixas progressivas com deducoes)
 * 8. Calcular FGTS (8% sobre remuneracao)
 * 9. Calcular descontos (VT, VA, plano de saude, faltas)
 * 10. Totalizar proventos vs descontos = salario liquido
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollCalculationEngine {

    private static final BigDecimal OVERTIME_50_RATE = new BigDecimal("1.50");
    private static final BigDecimal OVERTIME_100_RATE = new BigDecimal("2.00");
    private static final BigDecimal NIGHT_SHIFT_RATE = new BigDecimal("0.20");
    private static final BigDecimal FGTS_RATE = new BigDecimal("0.08");
    private static final BigDecimal TRANSPORT_VOUCHER_MAX_RATE = new BigDecimal("0.06");
    private static final BigDecimal MONTHLY_HOURS = new BigDecimal("220");
    private static final BigDecimal VACATION_BONUS_RATE = new BigDecimal("0.3333");

    private final TaxBracketRepository taxBracketRepository;

    public Payroll calculate(UUID tenantId,
                             EmployeeDTO employee,
                             TimesheetDTO timesheet,
                             List<VacationDTO> vacations,
                             PerformanceBonusDTO bonus,
                             EmployeeBenefitCalculationResponse benefits,
                             Integer month, Integer year) {

        log.info("Iniciando calculo de folha para colaborador {} - {}/{}", employee.getFullName(), month, year);

        BigDecimal baseSalary = employee.getBaseSalary();
        BigDecimal hourlyRate = baseSalary.divide(MONTHLY_HOURS, 4, RoundingMode.HALF_UP);
        
        // --- Calculo de Pro-rata (Admissao no mes ou Faltas) ---
        int daysInMonth = (timesheet != null && timesheet.getTotalDaysInMonth() != null) ? timesheet.getTotalDaysInMonth() : 30;
        int effectiveWorkedDays = daysInMonth; // Padrao 30 dias se nao houver info contraria
        
        // Se temos info do timesheet sobre dias trabalhados de fato (admissao/demissao/afastamento no mes)
        if (timesheet != null && timesheet.getWorkedDays() != null) {
            effectiveWorkedDays = timesheet.getWorkedDays().intValue();
        } else if (employee.getHireDate() != null) {
            // Fallback para hireDate se o timesheet nao informou dias trabalhados
            LocalDate startOfMonth = LocalDate.of(year, month, 1);
            LocalDate endOfMonth = startOfMonth.plusMonths(1).minusDays(1);
            
            if (employee.getHireDate().isAfter(startOfMonth) && !employee.getHireDate().isAfter(endOfMonth)) {
                int startDay = employee.getHireDate().getDayOfMonth();
                effectiveWorkedDays = daysInMonth - startDay + 1;
            }
        }
        
        BigDecimal proportionalBaseSalary = baseSalary;
        if (effectiveWorkedDays < daysInMonth) {
            proportionalBaseSalary = baseSalary.divide(new BigDecimal(daysInMonth), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(effectiveWorkedDays))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        Payroll payroll = Payroll.builder()
                .tenantId(tenantId)
                .employeeId(employee.getId())
                .employeeName(employee.getFullName())
                .employeeCpf(employee.getCpf())
                .registrationNumber(employee.getRegistrationNumber())
                .departmentName(employee.getDepartmentName())
                .positionName(employee.getPositionName())
                .referenceMonth(month)
                .referenceYear(year)
                .baseSalary(baseSalary)
                .status(PayrollStatus.CALCULATED)
                .build();

        int sortOrder = 0;

        // === PROVENTOS ===

        // 1. Salario Base (ajustado por pro-rata se necessario)
        sortOrder++;
        String baseDesc = effectiveWorkedDays < daysInMonth ? "Salário Proporcional (" + effectiveWorkedDays + " dias)" : "Salário Base";
        payroll.addItem(buildItem(tenantId, PayrollItemType.EARNING, PayrollItemCode.BASE_SALARY,
                baseDesc, baseSalary, new BigDecimal(effectiveWorkedDays), null, proportionalBaseSalary, sortOrder));

        // 2. Horas Extras 50%
        if (timesheet != null && timesheet.getOvertime50Hours() != null
                && timesheet.getOvertime50Hours().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal ot50Value = hourlyRate.multiply(OVERTIME_50_RATE)
                    .multiply(timesheet.getOvertime50Hours())
                    .setScale(2, RoundingMode.HALF_UP);
            sortOrder++;
            payroll.addItem(buildItem(tenantId, PayrollItemType.EARNING, PayrollItemCode.OVERTIME_50,
                    "Horas Extras 50%", hourlyRate, timesheet.getOvertime50Hours(),
                    new BigDecimal("50"), ot50Value, sortOrder));
        }

        // 3. Horas Extras 100%
        if (timesheet != null && timesheet.getOvertime100Hours() != null
                && timesheet.getOvertime100Hours().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal ot100Value = hourlyRate.multiply(OVERTIME_100_RATE)
                    .multiply(timesheet.getOvertime100Hours())
                    .setScale(2, RoundingMode.HALF_UP);
            sortOrder++;
            payroll.addItem(buildItem(tenantId, PayrollItemType.EARNING, PayrollItemCode.OVERTIME_100,
                    "Horas Extras 100%", hourlyRate, timesheet.getOvertime100Hours(),
                    new BigDecimal("100"), ot100Value, sortOrder));
        }

        // 4. Adicional Noturno (20% sobre hora normal)
        if (timesheet != null && timesheet.getNightShiftHours() != null
                && timesheet.getNightShiftHours().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal nightValue = hourlyRate.multiply(NIGHT_SHIFT_RATE)
                    .multiply(timesheet.getNightShiftHours())
                    .setScale(2, RoundingMode.HALF_UP);
            sortOrder++;
            payroll.addItem(buildItem(tenantId, PayrollItemType.EARNING, PayrollItemCode.NIGHT_SHIFT_PREMIUM,
                    "Adicional Noturno 20%", hourlyRate, timesheet.getNightShiftHours(),
                    new BigDecimal("20"), nightValue, sortOrder));
        }

        // 5. Bonus de performance
        if (bonus != null && bonus.getBonusAmount() != null
                && bonus.getBonusAmount().compareTo(BigDecimal.ZERO) > 0) {
            sortOrder++;
            payroll.addItem(buildItem(tenantId, PayrollItemType.EARNING, PayrollItemCode.BONUS,
                    "Bônus - " + (bonus.getReason() != null ? bonus.getReason() : "Performance"),
                    null, null, null, bonus.getBonusAmount(), sortOrder));
        }

        // 6. Comissao
        if (bonus != null && bonus.getCommissionAmount() != null
                && bonus.getCommissionAmount().compareTo(BigDecimal.ZERO) > 0) {
            sortOrder++;
            payroll.addItem(buildItem(tenantId, PayrollItemType.EARNING, PayrollItemCode.COMMISSION,
                    "Comissão", null, null, null, bonus.getCommissionAmount(), sortOrder));
        }

        // 7. Ferias
        if (vacations != null && !vacations.isEmpty()) {
            for (VacationDTO vacation : vacations) {
                if (vacation.getVacationPay() != null && vacation.getVacationPay().compareTo(BigDecimal.ZERO) > 0) {
                    sortOrder++;
                    payroll.addItem(buildItem(tenantId, PayrollItemType.EARNING, PayrollItemCode.VACATION_PAY,
                            "Ferias (" + vacation.getTotalDays() + " dias)",
                            null, BigDecimal.valueOf(vacation.getTotalDays()), null,
                            vacation.getVacationPay(), sortOrder));
                }
                if (vacation.getVacationBonus() != null && vacation.getVacationBonus().compareTo(BigDecimal.ZERO) > 0) {
                    sortOrder++;
                    payroll.addItem(buildItem(tenantId, PayrollItemType.EARNING, PayrollItemCode.VACATION_BONUS,
                            "1/3 Constitucional de Ferias",
                            null, null, new BigDecimal("33.33"),
                            vacation.getVacationBonus(), sortOrder));
                }
            }
        }

        // 8. Benefícios (do benefits-service)
        if (benefits != null && benefits.getItems() != null) {
            for (EmployeeBenefitCalculationResponse.BenefitItem item : benefits.getItems()) {
                if ("EARNING".equals(item.getCategory())) {
                    sortOrder++;
                    payroll.addItem(buildItem(tenantId, PayrollItemType.EARNING, PayrollItemCode.OTHER_EARNING,
                            item.getBenefitTypeName(), item.getFixedValue(), null, item.getPercentage(),
                            item.getCalculatedAmount(), sortOrder));
                }
            }
        }

        // Calcular total de proventos para base dos impostos
        payroll.recalculateTotals();
        BigDecimal grossSalary = payroll.getTotalEarnings();

        // === DESCONTOS ===

        // 8. Faltas
        if (timesheet != null && timesheet.getAbsenceDays() != null
                && timesheet.getAbsenceDays().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal dailyRate = baseSalary.divide(new BigDecimal("30"), 4, RoundingMode.HALF_UP);
            BigDecimal absenceValue = dailyRate.multiply(timesheet.getAbsenceDays())
                    .setScale(2, RoundingMode.HALF_UP);
            sortOrder++;
            payroll.addItem(buildItem(tenantId, PayrollItemType.DEDUCTION, PayrollItemCode.ABSENCE_DEDUCTION,
                    "Desconto por Faltas (" + timesheet.getAbsenceDays() + " dias)",
                    dailyRate, timesheet.getAbsenceDays(), null, absenceValue, sortOrder));
            // Ajusta base para calculo de impostos
            grossSalary = grossSalary.subtract(absenceValue);
        }

        // 10. Descontos de Benefícios (do benefits-service)
        if (benefits != null && benefits.getItems() != null) {
            for (EmployeeBenefitCalculationResponse.BenefitItem item : benefits.getItems()) {
                if ("DEDUCTION".equals(item.getCategory())) {
                    sortOrder++;
                    PayrollItemCode code = PayrollItemCode.OTHER_DEDUCTION;
                    if (item.getBenefitTypeName().toLowerCase().contains("transporte")) code = PayrollItemCode.TRANSPORT_VOUCHER;
                    if (item.getBenefitTypeName().toLowerCase().contains("alimentação")) code = PayrollItemCode.MEAL_VOUCHER;
                    if (item.getBenefitTypeName().toLowerCase().contains("saúde")) code = PayrollItemCode.HEALTH_INSURANCE;

                    payroll.addItem(buildItem(tenantId, PayrollItemType.DEDUCTION, code,
                            item.getBenefitTypeName(), item.getFixedValue(), null, item.getPercentage(),
                            item.getCalculatedAmount(), sortOrder));
                }
            }
        }

        // 9. INSS (faixas progressivas)
        LocalDate referenceDate = LocalDate.of(year, month, 1);
        BigDecimal inssAmount = calculateINSS(tenantId, grossSalary, referenceDate);
        sortOrder++;
        payroll.addItem(buildItem(tenantId, PayrollItemType.DEDUCTION, PayrollItemCode.INSS,
                "INSS", grossSalary, null, null, inssAmount, sortOrder));

        // 10. IRRF (faixas progressivas com deducao do INSS)
        BigDecimal irrfBase = grossSalary.subtract(inssAmount);
        // Deducao por dependente (valor fixo padrao R$ 189,59 por dependente)
        if (employee.getDependentsCount() != null && employee.getDependentsCount() > 0) {
            BigDecimal dependentDeduction = new BigDecimal("189.59")
                    .multiply(BigDecimal.valueOf(employee.getDependentsCount()));
            irrfBase = irrfBase.subtract(dependentDeduction);
        }
        BigDecimal irrfAmount = calculateIRRF(tenantId, irrfBase, referenceDate);
        sortOrder++;
        payroll.addItem(buildItem(tenantId, PayrollItemType.DEDUCTION, PayrollItemCode.IRRF,
                "IRRF", irrfBase, null, null, irrfAmount, sortOrder));

        // 11. FGTS (8% - nao desconta do salario, mas registrado no holerite)
        BigDecimal fgtsAmount = grossSalary.multiply(FGTS_RATE).setScale(2, RoundingMode.HALF_UP);
        payroll.setFgtsAmount(fgtsAmount);

        // 12. Vale Transporte (6% do salario base, se aplicavel)
        if (Boolean.TRUE.equals(employee.getHasTransportVoucher())) {
            BigDecimal vtRate = employee.getTransportVoucherDiscount() != null
                    ? employee.getTransportVoucherDiscount().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)
                    : TRANSPORT_VOUCHER_MAX_RATE;
            BigDecimal vtAmount = baseSalary.multiply(vtRate).setScale(2, RoundingMode.HALF_UP);
            sortOrder++;
            payroll.addItem(buildItem(tenantId, PayrollItemType.DEDUCTION, PayrollItemCode.TRANSPORT_VOUCHER,
                    "Vale Transporte", baseSalary, null,
                    vtRate.multiply(new BigDecimal("100")), vtAmount, sortOrder));
        }

        // 13. Vale Alimentacao
        if (Boolean.TRUE.equals(employee.getHasMealVoucher()) && employee.getMealVoucherDiscount() != null
                && employee.getMealVoucherDiscount().compareTo(BigDecimal.ZERO) > 0) {
            sortOrder++;
            payroll.addItem(buildItem(tenantId, PayrollItemType.DEDUCTION, PayrollItemCode.MEAL_VOUCHER,
                    "Vale Alimentacao", null, null, null,
                    employee.getMealVoucherDiscount(), sortOrder));
        }

        // 14. Plano de Saude
        if (Boolean.TRUE.equals(employee.getHasHealthInsurance()) && employee.getHealthInsuranceDiscount() != null
                && employee.getHealthInsuranceDiscount().compareTo(BigDecimal.ZERO) > 0) {
            sortOrder++;
            payroll.addItem(buildItem(tenantId, PayrollItemType.DEDUCTION, PayrollItemCode.HEALTH_INSURANCE,
                    "Plano de Saude", null, null, null,
                    employee.getHealthInsuranceDiscount(), sortOrder));
        }

        // Recalcular totais finais
        payroll.recalculateTotals();

        log.info("Calculo finalizado para {} - Bruto: {}, Descontos: {}, Liquido: {}, FGTS: {}",
                employee.getFullName(), payroll.getTotalEarnings(), payroll.getTotalDeductions(),
                payroll.getNetSalary(), payroll.getFgtsAmount());

        return payroll;
    }

    /**
     * Calcula INSS progressivo por faixas.
     * Se nao houver faixas configuradas, usa tabela padrao 2024.
     */
    BigDecimal calculateINSS(UUID tenantId, BigDecimal grossSalary, LocalDate referenceDate) {
        List<TaxBracket> brackets = taxBracketRepository.findActiveBrackets(tenantId, "INSS", referenceDate);

        if (brackets.isEmpty()) {
            return calculateINSSDefault(grossSalary);
        }

        BigDecimal totalInss = BigDecimal.ZERO;
        BigDecimal remaining = grossSalary;

        for (TaxBracket bracket : brackets) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal bracketRange;
            if (bracket.getMaxValue() != null) {
                bracketRange = bracket.getMaxValue().subtract(bracket.getMinValue());
            } else {
                bracketRange = remaining;
            }

            BigDecimal taxableInBracket = remaining.min(bracketRange);
            BigDecimal rate = bracket.getRate().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            totalInss = totalInss.add(taxableInBracket.multiply(rate));
            remaining = remaining.subtract(taxableInBracket);
        }

        return totalInss.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Tabela INSS padrao (2024) - faixas progressivas.
     */
    private BigDecimal calculateINSSDefault(BigDecimal grossSalary) {
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal remaining = grossSalary;

        // Faixa 1: ate R$ 1.412,00 - 7,5%
        BigDecimal f1Limit = new BigDecimal("1412.00");
        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal taxable = remaining.min(f1Limit);
            total = total.add(taxable.multiply(new BigDecimal("0.075")));
            remaining = remaining.subtract(taxable);
        }

        // Faixa 2: de R$ 1.412,01 ate R$ 2.666,68 - 9%
        BigDecimal f2Range = new BigDecimal("1254.68");
        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal taxable = remaining.min(f2Range);
            total = total.add(taxable.multiply(new BigDecimal("0.09")));
            remaining = remaining.subtract(taxable);
        }

        // Faixa 3: de R$ 2.666,69 ate R$ 4.000,03 - 12%
        BigDecimal f3Range = new BigDecimal("1333.35");
        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal taxable = remaining.min(f3Range);
            total = total.add(taxable.multiply(new BigDecimal("0.12")));
            remaining = remaining.subtract(taxable);
        }

        // Faixa 4: de R$ 4.000,04 ate R$ 7.786,02 - 14%
        BigDecimal f4Range = new BigDecimal("3785.99");
        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal taxable = remaining.min(f4Range);
            total = total.add(taxable.multiply(new BigDecimal("0.14")));
        }

        // Teto INSS: R$ 908,86
        BigDecimal ceiling = new BigDecimal("908.86");
        return total.min(ceiling).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calcula IRRF por faixas.
     * Se nao houver faixas configuradas, usa tabela padrao 2024.
     */
    BigDecimal calculateIRRF(UUID tenantId, BigDecimal taxableBase, LocalDate referenceDate) {
        if (taxableBase.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        List<TaxBracket> brackets = taxBracketRepository.findActiveBrackets(tenantId, "IRRF", referenceDate);

        if (brackets.isEmpty()) {
            return calculateIRRFDefault(taxableBase);
        }

        // IRRF usa aliquota efetiva (nao progressivo por faixa como INSS)
        for (int i = brackets.size() - 1; i >= 0; i--) {
            TaxBracket bracket = brackets.get(i);
            if (taxableBase.compareTo(bracket.getMinValue()) >= 0) {
                BigDecimal rate = bracket.getRate().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
                BigDecimal deduction = bracket.getDeductionAmount() != null ? bracket.getDeductionAmount() : BigDecimal.ZERO;
                BigDecimal irrf = taxableBase.multiply(rate).subtract(deduction);
                return irrf.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            }
        }

        return BigDecimal.ZERO;
    }

    /**
     * Tabela IRRF padrao (2024).
     */
    private BigDecimal calculateIRRFDefault(BigDecimal taxableBase) {
        // Faixa 1: ate R$ 2.259,20 - Isento
        if (taxableBase.compareTo(new BigDecimal("2259.20")) <= 0) {
            return BigDecimal.ZERO;
        }
        // Faixa 2: de R$ 2.259,21 ate R$ 2.826,65 - 7,5% - deducao R$ 169,44
        if (taxableBase.compareTo(new BigDecimal("2826.65")) <= 0) {
            return taxableBase.multiply(new BigDecimal("0.075"))
                    .subtract(new BigDecimal("169.44"))
                    .max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }
        // Faixa 3: de R$ 2.826,66 ate R$ 3.751,05 - 15% - deducao R$ 381,44
        if (taxableBase.compareTo(new BigDecimal("3751.05")) <= 0) {
            return taxableBase.multiply(new BigDecimal("0.15"))
                    .subtract(new BigDecimal("381.44"))
                    .max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }
        // Faixa 4: de R$ 3.751,06 ate R$ 4.664,68 - 22,5% - deducao R$ 662.77
        if (taxableBase.compareTo(new BigDecimal("4664.68")) <= 0) {
            return taxableBase.multiply(new BigDecimal("0.225"))
                    .subtract(new BigDecimal("662.77"))
                    .max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }
        // Faixa 5: acima de R$ 4.664,68 - 27,5% - deducao R$ 896,00
        return taxableBase.multiply(new BigDecimal("0.275"))
                .subtract(new BigDecimal("896.00"))
                .max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private PayrollItem buildItem(UUID tenantId, PayrollItemType type, PayrollItemCode code,
                                  String description, BigDecimal referenceValue,
                                  BigDecimal quantity, BigDecimal percentage,
                                  BigDecimal amount, int sortOrder) {
        return PayrollItem.builder()
                .tenantId(tenantId)
                .type(type)
                .code(code)
                .description(description)
                .referenceValue(referenceValue)
                .quantity(quantity)
                .percentage(percentage)
                .amount(amount)
                .sortOrder(sortOrder)
                .build();
    }
}
