package com.axonrh.employee.entity.enums;

/**
 * Status da vaga
 */
public enum VacancyStatus {
    DRAFT,      // Rascunho - não publicada
    OPEN,       // Aberta para candidaturas
    PAUSED,     // Pausada temporariamente
    CLOSED,     // Fechada - vaga preenchida
    CANCELLED   // Cancelada
}
