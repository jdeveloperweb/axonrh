package com.axonrh.employee.entity.enums;

import com.fasterxml.jackson.annotation.JsonAlias;

/**
 * Tipo de vinculo empregaticio.
 */
public enum EmploymentType {
    CLT,
    PJ,
    @JsonAlias({"ESTAGIARIO", "INTERN"})
    ESTAGIARIO,
    @JsonAlias({"TEMPORARIO", "TEMPORARY"})
    TEMPORARIO,
    @JsonAlias({"APRENDIZ", "APPRENTICE", "TRAINEE"})
    APRENDIZ,
    @JsonAlias({"AUTONOMO", "FREELANCER"})
    AUTONOMO,
    @JsonAlias({"TERCEIRIZADO", "OUTSOURCED"})
    TERCEIRIZADO
}

