package com.axonrh.performance.entity.enums;

/**
 * Status de um PDI.
 */
public enum PDIStatus {
    DRAFT("Rascunho"),
    PENDING_APPROVAL("Aguardando Aprovacao"),
    ACTIVE("Ativo"),
    ON_HOLD("Pausado"),
    COMPLETED("Concluido"),
    CANCELLED("Cancelado");

    private final String label;

    PDIStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
