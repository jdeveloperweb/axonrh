package com.axonrh.employee.entity.enums;

import com.fasterxml.jackson.annotation.JsonAlias;

public enum Race {
    @JsonAlias({"BRANCO", "WHITE"})
    BRANCO,
    @JsonAlias({"PRETO", "BLACK"})
    PRETO,
    @JsonAlias({"PARDO", "MIXED", "BROWN"})
    PARDO,
    @JsonAlias({"AMARELO", "ASIAN", "YELLOW"})
    AMARELO,
    @JsonAlias({"INDIGENA", "INDIGENOUS", "NATIVE"})
    INDIGENA,
    @JsonAlias({"NAO_INFORMADO", "NOT_INFORMED", "UNKNOWN"})
    NAO_INFORMADO
}

