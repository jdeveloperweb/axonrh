package com.axonrh.performance.entity.enums;

public enum CycleStatus {
    DRAFT,        // Rascunho
    ACTIVE,       // Ativo
    SELF_EVAL,    // Fase de autoavaliacao
    MANAGER_EVAL, // Fase de avaliacao do gestor
    CALIBRATION,  // Fase de calibracao
    FEEDBACK,     // Fase de feedback
    COMPLETED,    // Concluido
    CANCELLED     // Cancelado
}
