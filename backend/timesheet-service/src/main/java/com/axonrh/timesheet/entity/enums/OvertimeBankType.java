package com.axonrh.timesheet.entity.enums;

/**
 * Tipo de movimentacao no banco de horas.
 */
public enum OvertimeBankType {
    CREDIT,     // Credito (horas extras trabalhadas)
    DEBIT,      // Debito (compensacao/folga)
    ADJUSTMENT, // Ajuste manual
    EXPIRATION, // Expiracao de horas (limite de 6 meses CLT)
    PAYOUT      // Pagamento em dinheiro
}
