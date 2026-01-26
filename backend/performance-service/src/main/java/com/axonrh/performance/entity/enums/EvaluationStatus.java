package com.axonrh.performance.entity.enums;

/**
 * Status de uma avaliacao.
 */
public enum EvaluationStatus {
    PENDING("Pendente"),
    IN_PROGRESS("Em Andamento"),
    SUBMITTED("Submetida"),
    CALIBRATED("Calibrada"),
    COMPLETED("Concluida"),
    CANCELLED("Cancelada");

    private final String label;

    EvaluationStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
