package com.axonrh.integration.esocial.entity.enums;

public enum ESocialEventStatus {
    PENDING("Pendente"),
    SENT("Enviado"),
    ACCEPTED("Aceito"),
    REJECTED("Rejeitado"),
    ERROR("Erro");

    private final String label;

    ESocialEventStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
