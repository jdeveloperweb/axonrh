package com.axonrh.timesheet.entity.enums;

/**
 * Status de solicitacao de ajuste de ponto.
 */
public enum AdjustmentStatus {
    PENDING,    // Aguardando aprovacao
    APPROVED,   // Aprovado
    REJECTED,   // Rejeitado
    CANCELLED   // Cancelado pelo solicitante
}
