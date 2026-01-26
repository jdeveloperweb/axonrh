package com.axonrh.performance.entity.enums;

/**
 * Tipo de acao do PDI.
 */
public enum PDIActionType {
    TRAINING("Treinamento"),
    COURSE("Curso"),
    CERTIFICATION("Certificacao"),
    MENTORING("Mentoria"),
    COACHING("Coaching"),
    PROJECT("Projeto"),
    JOB_ROTATION("Job Rotation"),
    SHADOWING("Shadowing"),
    READING("Leitura"),
    WORKSHOP("Workshop"),
    CONFERENCE("Conferencia"),
    FEEDBACK("Feedback"),
    OTHER("Outro");

    private final String label;

    PDIActionType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
