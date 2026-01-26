package com.axonrh.learning.entity.enums;

public enum EnrollmentStatus {
    ENROLLED("Matriculado"),
    IN_PROGRESS("Em Andamento"),
    COMPLETED("Concluido"),
    FAILED("Reprovado"),
    CANCELLED("Cancelado"),
    EXPIRED("Expirado");

    private final String label;

    EnrollmentStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
