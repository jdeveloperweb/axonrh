package com.axonrh.performance.entity.enums;

/**
 * Status de uma meta.
 */
public enum GoalStatus {
    NOT_STARTED("Nao Iniciada"),
    IN_PROGRESS("Em Andamento"),
    ON_HOLD("Pausada"),
    AT_RISK("Em Risco"),
    COMPLETED("Concluida"),
    CANCELLED("Cancelada");

    private final String label;

    GoalStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
