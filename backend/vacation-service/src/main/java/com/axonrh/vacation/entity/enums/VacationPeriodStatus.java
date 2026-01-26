package com.axonrh.vacation.entity.enums;

/**
 * Status do periodo aquisitivo de ferias.
 */
public enum VacationPeriodStatus {
    OPEN,           // Periodo aberto, pode solicitar ferias
    SCHEDULED,      // Ferias ja agendadas
    PARTIALLY_USED, // Parte das ferias ja gozadas (fracionamento)
    COMPLETED,      // Todas as ferias gozadas
    EXPIRED,        // Periodo expirou sem gozo completo
    CANCELLED       // Cancelado (demissao, etc)
}
