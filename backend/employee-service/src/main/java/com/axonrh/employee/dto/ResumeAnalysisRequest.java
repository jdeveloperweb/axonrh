package com.axonrh.employee.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request para análise de currículo pela IA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAnalysisRequest {

    @Schema(description = "Conteúdo do currículo em texto")
    private String resumeText;

    @Schema(description = "Nome do arquivo")
    private String fileName;

    @Schema(description = "Tipo do arquivo")
    private String fileType;

    @Schema(description = "Requisitos da vaga para comparação")
    private String vacancyRequirements;
}
