package com.axonrh.employee.dto;

import lombok.*;

/**
 * Estatisticas dos processos de contratacao digital.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalHiringStatsResponse {

    private long total;
    private long admissionPending;
    private long documentsPending;
    private long documentsValidating;
    private long signaturePending;
    private long completed;
    private long cancelled;
    private double averageCompletionDays;
}
