package com.axonrh.performance.entity.enums;

/**
 * Status de uma acao do PDI.
 */
public enum PDIActionStatus {
    PENDING("Pendente"),
    IN_PROGRESS("Em Andamento"),
    COMPLETED("Concluida"),
    CANCELLED("Cancelada");

    private final String label;

    PDIActionStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
