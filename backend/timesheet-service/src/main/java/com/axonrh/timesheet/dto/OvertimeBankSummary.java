package com.axonrh.timesheet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Resumo do banco de horas de um colaborador.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OvertimeBankSummary {

    private UUID employeeId;
    private String employeeName;

    // Saldo atual
    private Integer currentBalanceMinutes;
    private String currentBalanceFormatted;
    private Boolean isPositive;

    // Totais do periodo
    private Integer totalCreditMinutes;
    private String totalCreditFormatted;
    private Integer totalDebitMinutes;
    private String totalDebitFormatted;
    private Integer totalExpiredMinutes;
    private String totalExpiredFormatted;
    private Integer totalPaidMinutes;
    private String totalPaidFormatted;

    // Horas proximas de expirar
    private Integer expiringMinutes;
    private String expiringFormatted;
    private Integer daysUntilNextExpiration;

    // Ultimas movimentacoes
    private List<OvertimeBankResponse> recentMovements;
}
