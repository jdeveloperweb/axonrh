package com.axonrh.employee.entity.enums;

import com.fasterxml.jackson.annotation.JsonAlias;

public enum BankAccountType {
    @JsonAlias({"CORRENTE", "CHECKING"})
    CORRENTE,
    
    @JsonAlias({"POUPANCA", "SAVINGS"})
    POUPANCA,
    
    @JsonAlias({"SALARIO", "SALARY"})
    SALARIO
}

