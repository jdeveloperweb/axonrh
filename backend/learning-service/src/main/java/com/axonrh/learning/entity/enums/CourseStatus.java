package com.axonrh.learning.entity.enums;

public enum CourseStatus {
    DRAFT("Rascunho"),
    PUBLISHED("Publicado"),
    ARCHIVED("Arquivado");

    private final String label;

    CourseStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
