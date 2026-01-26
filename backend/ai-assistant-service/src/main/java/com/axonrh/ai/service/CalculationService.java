package com.axonrh.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class CalculationService {

    // INSS rates for 2024
    private static final BigDecimal[][] INSS_RATES = {
            {new BigDecimal("1412.00"), new BigDecimal("0.075")},
            {new BigDecimal("2666.68"), new BigDecimal("0.09")},
            {new BigDecimal("4000.03"), new BigDecimal("0.12")},
            {new BigDecimal("7786.02"), new BigDecimal("0.14")}
    };

    // IRRF rates for 2024
    private static final BigDecimal[][] IRRF_RATES = {
            {new BigDecimal("2259.20"), BigDecimal.ZERO, BigDecimal.ZERO},
            {new BigDecimal("2826.65"), new BigDecimal("0.075"), new BigDecimal("169.44")},
            {new BigDecimal("3751.05"), new BigDecimal("0.15"), new BigDecimal("381.44")},
            {new BigDecimal("4664.68"), new BigDecimal("0.225"), new BigDecimal("662.77")},
            {new BigDecimal("999999999"), new BigDecimal("0.275"), new BigDecimal("896.00")}
    };

    private static final BigDecimal IRRF_DEPENDENT_DEDUCTION = new BigDecimal("189.59");

    public CalculationResult calculateVacation(BigDecimal salary, int days, boolean withAbono, int dependents) {
        Map<String, Object> details = new HashMap<>();
        StringBuilder steps = new StringBuilder();

        // Base vacation value
        BigDecimal dailyRate = salary.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
        BigDecimal vacationBase = dailyRate.multiply(BigDecimal.valueOf(days));
        details.put("salarioBase", salary);
        details.put("valorDiario", dailyRate);
        details.put("dias", days);
        details.put("valorFerias", vacationBase);

        steps.append(String.format("1. Valor diário: R$ %.2f / 30 = R$ %.2f\n", salary, dailyRate));
        steps.append(String.format("2. Férias (%d dias): R$ %.2f x %d = R$ %.2f\n", days, dailyRate, days, vacationBase));

        // 1/3 constitutional
        BigDecimal oneThird = vacationBase.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
        details.put("tercoConstitucional", oneThird);
        steps.append(String.format("3. 1/3 constitucional: R$ %.2f / 3 = R$ %.2f\n", vacationBase, oneThird));

        BigDecimal totalGross = vacationBase.add(oneThird);

        // Abono pecuniário (selling up to 10 days)
        BigDecimal abonoValue = BigDecimal.ZERO;
        BigDecimal abonoOneThird = BigDecimal.ZERO;
        if (withAbono) {
            int abonoDays = Math.min(10, days / 3);
            abonoValue = dailyRate.multiply(BigDecimal.valueOf(abonoDays));
            abonoOneThird = abonoValue.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
            details.put("abonoDias", abonoDays);
            details.put("abonoValor", abonoValue);
            details.put("abonoTerco", abonoOneThird);
            totalGross = totalGross.add(abonoValue).add(abonoOneThird);
            steps.append(String.format("4. Abono pecuniário (%d dias): R$ %.2f\n", abonoDays, abonoValue));
            steps.append(String.format("5. 1/3 do abono: R$ %.2f\n", abonoOneThird));
        }

        details.put("totalBruto", totalGross);
        steps.append(String.format("6. Total bruto: R$ %.2f\n", totalGross));

        // Calculate INSS (excluding abono which is exempt)
        BigDecimal inssBase = vacationBase.add(oneThird);
        BigDecimal inss = calculateINSS(inssBase);
        details.put("baseINSS", inssBase);
        details.put("inss", inss);
        steps.append(String.format("7. INSS (base R$ %.2f): R$ %.2f\n", inssBase, inss));

        // Calculate IRRF
        BigDecimal irrfBase = inssBase.subtract(inss);
        BigDecimal dependentDeduction = IRRF_DEPENDENT_DEDUCTION.multiply(BigDecimal.valueOf(dependents));
        irrfBase = irrfBase.subtract(dependentDeduction);
        BigDecimal irrf = calculateIRRF(irrfBase);
        details.put("baseIRRF", irrfBase);
        details.put("deducaoDependentes", dependentDeduction);
        details.put("irrf", irrf);
        steps.append(String.format("8. IRRF (base R$ %.2f): R$ %.2f\n", irrfBase, irrf));

        // Net value
        BigDecimal totalNet = totalGross.subtract(inss).subtract(irrf);
        details.put("totalLiquido", totalNet);
        steps.append(String.format("9. Total líquido: R$ %.2f - R$ %.2f - R$ %.2f = R$ %.2f\n",
                totalGross, inss, irrf, totalNet));

        return CalculationResult.builder()
                .type("FERIAS")
                .grossValue(totalGross)
                .netValue(totalNet)
                .details(details)
                .steps(steps.toString())
                .legalBasis("Art. 129 a 145 da CLT, Art. 7º, XVII da CF/88")
                .build();
    }

    public CalculationResult calculateTermination(BigDecimal salary, LocalDate hireDate, LocalDate terminationDate,
                                                   String terminationType, int vacationDaysUsed,
                                                   boolean workedNotice, BigDecimal fgtsBalance) {
        Map<String, Object> details = new HashMap<>();
        StringBuilder steps = new StringBuilder();

        long totalMonths = ChronoUnit.MONTHS.between(hireDate, terminationDate);
        int currentMonthDay = terminationDate.getDayOfMonth();

        details.put("salarioBase", salary);
        details.put("dataAdmissao", hireDate.toString());
        details.put("dataDesligamento", terminationDate.toString());
        details.put("tipoRescisao", terminationType);
        details.put("mesesTrabalhados", totalMonths);

        BigDecimal totalGross = BigDecimal.ZERO;

        // Saldo de salário (days worked in current month)
        BigDecimal dailyRate = salary.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
        BigDecimal saldoSalario = dailyRate.multiply(BigDecimal.valueOf(currentMonthDay));
        details.put("saldoSalario", saldoSalario);
        totalGross = totalGross.add(saldoSalario);
        steps.append(String.format("1. Saldo de salário (%d dias): R$ %.2f\n", currentMonthDay, saldoSalario));

        // 13º salário proporcional
        int monthsFor13 = terminationDate.getMonthValue();
        if (currentMonthDay >= 15) monthsFor13++;
        BigDecimal decimoTerceiro = salary.multiply(BigDecimal.valueOf(monthsFor13))
                .divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        details.put("decimoTerceiroProporcional", decimoTerceiro);
        details.put("meses13", monthsFor13);
        totalGross = totalGross.add(decimoTerceiro);
        steps.append(String.format("2. 13º proporcional (%d/12): R$ %.2f\n", monthsFor13, decimoTerceiro));

        // Férias proporcionais + 1/3
        int acquisitionMonths = (int) (totalMonths % 12);
        if (acquisitionMonths == 0) acquisitionMonths = 12;
        BigDecimal feriasProporcionais = salary.multiply(BigDecimal.valueOf(acquisitionMonths))
                .divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        BigDecimal tercoFerias = feriasProporcionais.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
        details.put("feriasProporcionais", feriasProporcionais);
        details.put("tercoFerias", tercoFerias);
        details.put("mesesFerias", acquisitionMonths);
        totalGross = totalGross.add(feriasProporcionais).add(tercoFerias);
        steps.append(String.format("3. Férias proporcionais (%d/12) + 1/3: R$ %.2f + R$ %.2f\n",
                acquisitionMonths, feriasProporcionais, tercoFerias));

        // Férias vencidas (if applicable)
        int completedYears = (int) (totalMonths / 12);
        BigDecimal feriasVencidas = BigDecimal.ZERO;
        BigDecimal tercoFeriasVencidas = BigDecimal.ZERO;
        if (completedYears > 0 && vacationDaysUsed < 30) {
            int daysOwed = 30 - vacationDaysUsed;
            feriasVencidas = dailyRate.multiply(BigDecimal.valueOf(daysOwed));
            tercoFeriasVencidas = feriasVencidas.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
            details.put("feriasVencidas", feriasVencidas);
            details.put("tercoFeriasVencidas", tercoFeriasVencidas);
            totalGross = totalGross.add(feriasVencidas).add(tercoFeriasVencidas);
            steps.append(String.format("4. Férias vencidas + 1/3: R$ %.2f + R$ %.2f\n",
                    feriasVencidas, tercoFeriasVencidas));
        }

        // Aviso prévio
        BigDecimal avisoPrevio = BigDecimal.ZERO;
        if (!terminationType.equals("JUSTA_CAUSA") && !terminationType.equals("PEDIDO_DEMISSAO")) {
            int noticeDays = Math.min(90, 30 + (int) (totalMonths / 12) * 3);
            if (!workedNotice) {
                avisoPrevio = dailyRate.multiply(BigDecimal.valueOf(noticeDays));
                details.put("avisoPrevioDias", noticeDays);
                details.put("avisoPrevioValor", avisoPrevio);
                totalGross = totalGross.add(avisoPrevio);
                steps.append(String.format("5. Aviso prévio indenizado (%d dias): R$ %.2f\n", noticeDays, avisoPrevio));
            }
        }

        details.put("totalBruto", totalGross);

        // Multa FGTS (40% for dismissal without cause, 20% for mutual agreement)
        BigDecimal multaFGTS = BigDecimal.ZERO;
        BigDecimal fgtsSaque = BigDecimal.ZERO;
        if (fgtsBalance != null && fgtsBalance.compareTo(BigDecimal.ZERO) > 0) {
            if (terminationType.equals("SEM_JUSTA_CAUSA")) {
                multaFGTS = fgtsBalance.multiply(new BigDecimal("0.40"));
                fgtsSaque = fgtsBalance;
                steps.append(String.format("6. Multa FGTS (40%%): R$ %.2f x 0.40 = R$ %.2f\n", fgtsBalance, multaFGTS));
            } else if (terminationType.equals("ACORDO")) {
                multaFGTS = fgtsBalance.multiply(new BigDecimal("0.20"));
                fgtsSaque = fgtsBalance.multiply(new BigDecimal("0.80"));
                steps.append(String.format("6. Multa FGTS (20%% acordo): R$ %.2f x 0.20 = R$ %.2f\n", fgtsBalance, multaFGTS));
                steps.append(String.format("   Saque FGTS (80%%): R$ %.2f\n", fgtsSaque));
            }
            details.put("multaFGTS", multaFGTS);
            details.put("fgtsSaque", fgtsSaque);
            details.put("saldoFGTS", fgtsBalance);
        }

        // Calculate deductions
        BigDecimal inss = calculateINSS(saldoSalario);
        BigDecimal irrfBase = saldoSalario.subtract(inss);
        BigDecimal irrf = calculateIRRF(irrfBase);
        details.put("inss", inss);
        details.put("irrf", irrf);

        BigDecimal totalNet = totalGross.subtract(inss).subtract(irrf).add(multaFGTS).add(fgtsSaque);
        details.put("totalLiquido", totalNet);

        steps.append(String.format("\nDeduções:\n- INSS: R$ %.2f\n- IRRF: R$ %.2f\n", inss, irrf));
        steps.append(String.format("\nTotal líquido da rescisão: R$ %.2f\n", totalNet));

        String legalBasis = switch (terminationType) {
            case "SEM_JUSTA_CAUSA" -> "Art. 477, 478, 487 da CLT";
            case "JUSTA_CAUSA" -> "Art. 482 da CLT";
            case "PEDIDO_DEMISSAO" -> "Art. 477, 487 da CLT";
            case "ACORDO" -> "Art. 484-A da CLT (Reforma Trabalhista)";
            default -> "CLT";
        };

        return CalculationResult.builder()
                .type("RESCISAO")
                .grossValue(totalGross)
                .netValue(totalNet)
                .details(details)
                .steps(steps.toString())
                .legalBasis(legalBasis)
                .build();
    }

    public CalculationResult calculateOvertime(BigDecimal hourlyRate, double regularHours,
                                                double overtime50Hours, double overtime100Hours,
                                                double nightHours) {
        Map<String, Object> details = new HashMap<>();
        StringBuilder steps = new StringBuilder();

        details.put("valorHora", hourlyRate);

        // Regular hours
        BigDecimal regularValue = hourlyRate.multiply(BigDecimal.valueOf(regularHours));
        details.put("horasNormais", regularHours);
        details.put("valorHorasNormais", regularValue);
        steps.append(String.format("1. Horas normais: %.2f x R$ %.2f = R$ %.2f\n",
                regularHours, hourlyRate, regularValue));

        // Overtime 50%
        BigDecimal overtime50Rate = hourlyRate.multiply(new BigDecimal("1.50"));
        BigDecimal overtime50Value = overtime50Rate.multiply(BigDecimal.valueOf(overtime50Hours));
        details.put("horasExtras50", overtime50Hours);
        details.put("valorHoraExtra50", overtime50Rate);
        details.put("valorHorasExtras50", overtime50Value);
        steps.append(String.format("2. Horas extras 50%%: %.2f x R$ %.2f = R$ %.2f\n",
                overtime50Hours, overtime50Rate, overtime50Value));

        // Overtime 100%
        BigDecimal overtime100Rate = hourlyRate.multiply(new BigDecimal("2.00"));
        BigDecimal overtime100Value = overtime100Rate.multiply(BigDecimal.valueOf(overtime100Hours));
        details.put("horasExtras100", overtime100Hours);
        details.put("valorHoraExtra100", overtime100Rate);
        details.put("valorHorasExtras100", overtime100Value);
        steps.append(String.format("3. Horas extras 100%%: %.2f x R$ %.2f = R$ %.2f\n",
                overtime100Hours, overtime100Rate, overtime100Value));

        // Night shift additional (20%)
        BigDecimal nightAdditional = hourlyRate.multiply(new BigDecimal("0.20"))
                .multiply(BigDecimal.valueOf(nightHours));
        details.put("horasNoturnas", nightHours);
        details.put("adicionalNoturno", nightAdditional);
        steps.append(String.format("4. Adicional noturno (20%%): %.2f horas x R$ %.2f = R$ %.2f\n",
                nightHours, hourlyRate.multiply(new BigDecimal("0.20")), nightAdditional));

        BigDecimal totalGross = regularValue.add(overtime50Value).add(overtime100Value).add(nightAdditional);
        details.put("totalBruto", totalGross);
        steps.append(String.format("\nTotal bruto: R$ %.2f\n", totalGross));

        return CalculationResult.builder()
                .type("HORAS_EXTRAS")
                .grossValue(totalGross)
                .netValue(totalGross) // Net would depend on full salary context
                .details(details)
                .steps(steps.toString())
                .legalBasis("Art. 59, 73 da CLT, Súmula 264 do TST")
                .build();
    }

    private BigDecimal calculateINSS(BigDecimal salary) {
        BigDecimal inss = BigDecimal.ZERO;
        BigDecimal previousLimit = BigDecimal.ZERO;

        for (BigDecimal[] bracket : INSS_RATES) {
            BigDecimal limit = bracket[0];
            BigDecimal rate = bracket[1];

            if (salary.compareTo(previousLimit) <= 0) break;

            BigDecimal taxableAmount = salary.min(limit).subtract(previousLimit);
            if (taxableAmount.compareTo(BigDecimal.ZERO) > 0) {
                inss = inss.add(taxableAmount.multiply(rate));
            }

            previousLimit = limit;
        }

        return inss.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateIRRF(BigDecimal base) {
        if (base.compareTo(IRRF_RATES[0][0]) <= 0) {
            return BigDecimal.ZERO;
        }

        for (BigDecimal[] bracket : IRRF_RATES) {
            if (base.compareTo(bracket[0]) <= 0) {
                BigDecimal rate = bracket[1];
                BigDecimal deduction = bracket[2];
                return base.multiply(rate).subtract(deduction).setScale(2, RoundingMode.HALF_UP);
            }
        }

        return BigDecimal.ZERO;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CalculationResult {
        private String type;
        private BigDecimal grossValue;
        private BigDecimal netValue;
        private Map<String, Object> details;
        private String steps;
        private String legalBasis;
    }
}
