package com.axonrh.performance.dto;

/**
 * Posicoes da Matriz 9Box.
 */
public enum NineBoxPosition {
    // Alta Performance
    STAR("Estrela", "Alto desempenho e alto potencial", 3, 3),
    KEY_PLAYER("Profissional Chave", "Alto desempenho e médio potencial", 3, 2),
    WORKHORSE("Colaborador Dedicado", "Alto desempenho e baixo potencial", 3, 1),

    // Media Performance
    HIGH_POTENTIAL("Alto Potencial", "Médio desempenho e alto potencial", 2, 3),
    CORE("Core", "Médio desempenho e médio potencial", 2, 2),
    SOLID_PERFORMER("Desempenho Sólido", "Médio desempenho e baixo potencial", 2, 1),

    // Baixa Performance
    FUTURE_STAR("Estrela Futura", "Baixo desempenho e alto potencial", 1, 3),
    DILEMMA("Dilema", "Baixo desempenho e médio potencial", 1, 2),
    UNDERPERFORMER("Baixo Desempenho", "Baixo desempenho e baixo potencial", 1, 1);

    private final String label;
    private final String description;
    private final int performanceLevel;
    private final int potentialLevel;

    NineBoxPosition(String label, String description, int performanceLevel, int potentialLevel) {
        this.label = label;
        this.description = description;
        this.performanceLevel = performanceLevel;
        this.potentialLevel = potentialLevel;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }

    public int getPerformanceLevel() {
        return performanceLevel;
    }

    public int getPotentialLevel() {
        return potentialLevel;
    }

    public String getColor() {
        return switch (this) {
            case STAR -> "#22c55e"; // Green
            case HIGH_POTENTIAL, FUTURE_STAR -> "#3b82f6"; // Blue
            case KEY_PLAYER, CORE -> "#eab308"; // Yellow
            case WORKHORSE, SOLID_PERFORMER -> "#f97316"; // Orange
            case DILEMMA, UNDERPERFORMER -> "#ef4444"; // Red
        };
    }

    public boolean isHiPo() {
        return this == STAR || this == HIGH_POTENTIAL || this == FUTURE_STAR;
    }

    public boolean isAtRisk() {
        return this == UNDERPERFORMER || this == DILEMMA;
    }
}
