package com.axonrh.vacation.entity.enums;

/**
 * Status da solicitacao de ferias.
 */
public enum VacationRequestStatus {
    PENDING,      // Aguardando aprovacao
    APPROVED,     // Aprovada
    REJECTED,     // Rejeitada
    CANCELLED,    // Cancelada pelo colaborador
    SCHEDULED,    // Agendada (apos aprovacao)
    IN_PROGRESS,  // Colaborador em ferias
    COMPLETED     // Ferias concluidas
}
