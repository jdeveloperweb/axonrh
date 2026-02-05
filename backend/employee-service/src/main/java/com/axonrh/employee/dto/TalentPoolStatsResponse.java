package com.axonrh.employee.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Estatísticas do Banco de Talentos
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TalentPoolStatsResponse {

    @Schema(description = "Total de vagas")
    private Long totalVacancies;

    @Schema(description = "Vagas abertas")
    private Long openVacancies;

    @Schema(description = "Vagas em rascunho")
    private Long draftVacancies;

    @Schema(description = "Vagas fechadas")
    private Long closedVacancies;

    @Schema(description = "Total de candidatos")
    private Long totalCandidates;

    @Schema(description = "Candidatos novos (não triados)")
    private Long newCandidates;

    @Schema(description = "Candidatos em processo")
    private Long inProcessCandidates;

    @Schema(description = "Candidatos aprovados")
    private Long approvedCandidates;

    @Schema(description = "Candidatos contratados")
    private Long hiredCandidates;

    @Schema(description = "Distribuição de candidatos por status")
    private Map<String, Long> candidatesByStatus;

    @Schema(description = "Distribuição de candidatos por vaga")
    private Map<String, Long> candidatesByVacancy;
}
