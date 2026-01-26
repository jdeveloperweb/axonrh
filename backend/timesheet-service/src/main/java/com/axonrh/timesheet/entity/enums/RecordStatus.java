package com.axonrh.timesheet.entity.enums;

/**
 * Status do registro de ponto.
 */
public enum RecordStatus {
    VALID,              // Registro valido
    PENDING_APPROVAL,   // Aguardando aprovacao (fora do geofence, sem foto, etc.)
    APPROVED,           // Aprovado manualmente
    REJECTED,           // Rejeitado
    ADJUSTED            // Ajustado
}
