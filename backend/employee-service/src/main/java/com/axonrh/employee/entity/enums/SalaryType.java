package com.axonrh.employee.entity.enums;

import com.fasterxml.jackson.annotation.JsonAlias;

public enum SalaryType {
    @JsonAlias({"MENSAL", "MONTHLY"})
    MENSAL,
    @JsonAlias({"QUINZENAL", "FORTNIGHTLY", "BIWEEKLY"})
    QUINZENAL,
    @JsonAlias({"SEMANAL", "WEEKLY"})
    SEMANAL,
    @JsonAlias({"DIARIO", "DAILY"})
    DIARIO,
    @JsonAlias({"HORISTA", "HOURLY"})
    HORISTA,
    @JsonAlias({"COMISSAO", "COMMISSION"})
    COMISSAO
}

