package com.axonrh.employee.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response da análise de currículo pela IA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAnalysisResponse {

    @Schema(description = "Nome completo extraído")
    private String fullName;

    @Schema(description = "Email extraído")
    private String email;

    @Schema(description = "Telefone extraído")
    private String phone;

    @Schema(description = "Lista de habilidades/competências")
    private List<String> skills;

    @Schema(description = "Formação acadêmica")
    private List<EducationEntry> education;

    @Schema(description = "Experiências profissionais")
    private List<ExperienceEntry> experiences;

    @Schema(description = "Certificações")
    private List<String> certifications;

    @Schema(description = "Idiomas")
    private List<LanguageEntry> languages;

    @Schema(description = "Resumo do perfil gerado pela IA")
    private String profileSummary;

    @Schema(description = "Pontuação de compatibilidade com a vaga (0-100)")
    private Integer compatibilityScore;

    @Schema(description = "Pontos fortes identificados")
    private List<String> strengths;

    @Schema(description = "Pontos de atenção")
    private List<String> concerns;

    @Schema(description = "Dados brutos extraídos")
    private Map<String, Object> rawData;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EducationEntry {
        private String institution;
        private String degree;
        private String field;
        private String startYear;
        private String endYear;
        private Boolean current;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExperienceEntry {
        private String company;
        private String position;
        private String description;
        private String startDate;
        private String endDate;
        private Boolean current;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LanguageEntry {
        private String language;
        private String level; // BASICO, INTERMEDIARIO, AVANCADO, FLUENTE, NATIVO
    }
}
