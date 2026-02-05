package com.axonrh.employee.entity.enums;

/**
 * Status do candidato no processo seletivo
 */
public enum CandidateStatus {
    NEW,        // Recém inscrito
    SCREENING,  // Em triagem
    INTERVIEW,  // Entrevista agendada/realizada
    APPROVED,   // Aprovado
    REJECTED,   // Rejeitado
    HIRED,      // Contratado
    WITHDRAWN   // Desistiu
}
