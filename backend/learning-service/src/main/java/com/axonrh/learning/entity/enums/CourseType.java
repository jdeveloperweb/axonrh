package com.axonrh.learning.entity.enums;

public enum CourseType {
    ONLINE("Online"),
    PRESENCIAL("Presencial"),
    HIBRIDO("Hibrido"),
    EXTERNAL("Externo");

    private final String label;

    CourseType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
