package com.axonrh.employee.entity.enums;

import com.fasterxml.jackson.annotation.JsonAlias;

public enum Ethnicity {
    @JsonAlias({"BRANCO", "WHITE"})
    BRANCO,
    @JsonAlias({"PARDO", "MIXED", "BROWN"})
    PARDO,
    @JsonAlias({"PRETO", "BLACK"})
    PRETO,
    @JsonAlias({"AMARELO", "ASIAN", "YELLOW"})
    AMARELO,
    @JsonAlias({"INDIGENA", "INDIGENOUS", "NATIVE"})
    INDIGENA
}

