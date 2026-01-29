package com.axonrh.employee.entity.enums;

/**
 * Tipos de desligamento (Brasil).
 */
public enum TerminationType {
    RESIGNATION,              // Pedido de demissão
    TERMINATION_WITHOUT_CAUSE, // Dispensa sem justa causa
    TERMINATION_WITH_CAUSE,    // Dispensa com justa causa
    AGREEMENT,                // Acordo (Reforma Trabalhista 2017)
    RETIREMENT,               // Aposentadoria
    DEATH,                    // Falecimento
    END_OF_CONTRACT           // Término de contrato (experiência/determinado)
}
