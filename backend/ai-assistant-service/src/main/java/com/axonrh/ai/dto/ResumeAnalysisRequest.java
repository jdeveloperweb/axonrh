package com.axonrh.ai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAnalysisRequest {

    @Schema(description = "Texto extraído do currículo")
    private String resumeText;

    @Schema(description = "Nome do arquivo original")
    private String fileName;

    @Schema(description = "Tipo do arquivo (PDF, WORD)")
    private String fileType;

    @Schema(description = "Requisitos da vaga para comparação")
    private String vacancyRequirements;
}
