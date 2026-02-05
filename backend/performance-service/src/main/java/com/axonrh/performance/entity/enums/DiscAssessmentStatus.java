package com.axonrh.performance.entity.enums;

public enum DiscAssessmentStatus {
    PENDING,      // Aguardando o colaborador iniciar
    IN_PROGRESS,  // Colaborador iniciou mas nao concluiu
    COMPLETED,    // Avaliacao finalizada
    EXPIRED,      // Prazo expirado
    CANCELLED     // Cancelada pelo gestor/RH
}
