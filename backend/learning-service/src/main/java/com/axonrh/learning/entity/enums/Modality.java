package com.axonrh.learning.entity.enums;

public enum Modality {
    SINCRONO("Sincrono"),
    ASSINCRONO("Assincrono"),
    AUTODIDATA("Autodidata");

    private final String label;

    Modality(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
