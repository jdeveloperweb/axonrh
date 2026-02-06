package com.axonrh.performance.entity.enums;

public enum DiscProfileType {
    DOMINANCE("D", "Dominante"),
    INFLUENCE("I", "Influente"),
    STEADINESS("S", "Estavel"),
    CONSCIENTIOUSNESS("C", "Conforme");

    private final String code;
    private final String label;

    DiscProfileType(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() {
        return code;
    }

    public String getLabel() {
        return label;
    }

    public static DiscProfileType fromCode(String code) {
        for (DiscProfileType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown DISC profile code: " + code);
    }
}
