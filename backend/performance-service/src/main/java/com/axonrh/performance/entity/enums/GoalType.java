package com.axonrh.performance.entity.enums;

/**
 * Tipo de meta.
 */
public enum GoalType {
    INDIVIDUAL("Individual"),
    TEAM("Equipe"),
    DEPARTMENT("Departamento"),
    COMPANY("Empresa");

    private final String label;

    GoalType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
