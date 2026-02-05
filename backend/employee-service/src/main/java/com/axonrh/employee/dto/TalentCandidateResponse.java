package com.axonrh.employee.dto;

import com.axonrh.employee.entity.enums.CandidateSource;
import com.axonrh.employee.entity.enums.CandidateStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TalentCandidateResponse {

    @Schema(description = "ID do candidato")
    private UUID id;

    @Schema(description = "ID da vaga")
    private UUID vacancyId;

    @Schema(description = "Título da vaga")
    private String vacancyTitle;

    @Schema(description = "Nome completo")
    private String fullName;

    @Schema(description = "Email")
    private String email;

    @Schema(description = "Telefone")
    private String phone;

    @Schema(description = "Celular")
    private String mobile;

    @Schema(description = "Cidade")
    private String city;

    @Schema(description = "Estado")
    private String state;

    @Schema(description = "LinkedIn URL")
    private String linkedinUrl;

    @Schema(description = "Portfólio URL")
    private String portfolioUrl;

    @Schema(description = "Nome do arquivo do currículo")
    private String resumeFileName;

    @Schema(description = "Caminho do arquivo do currículo")
    private String resumeFilePath;

    @Schema(description = "Tipo do arquivo do currículo")
    private String resumeFileType;

    @Schema(description = "Dados extraídos do currículo")
    private Map<String, Object> resumeParsedData;

    @Schema(description = "Habilidades extraídas")
    private String skills;

    @Schema(description = "Formação acadêmica")
    private String education;

    @Schema(description = "Resumo de experiência")
    private String experienceSummary;

    @Schema(description = "Certificações")
    private String certifications;

    @Schema(description = "Idiomas")
    private String languages;

    @Schema(description = "Status do candidato")
    private CandidateStatus status;

    @Schema(description = "Notas do status")
    private String statusNotes;

    @Schema(description = "Avaliação (1-5)")
    private Integer rating;

    @Schema(description = "Notas/observações")
    private String notes;

    @Schema(description = "Origem do candidato")
    private CandidateSource source;

    @Schema(description = "Nome de quem indicou")
    private String referralName;

    @Schema(description = "Data da candidatura")
    private LocalDateTime appliedAt;

    @Schema(description = "Última mudança de status")
    private LocalDateTime lastStatusChange;

    @Schema(description = "Candidato ativo")
    private Boolean isActive;

    @Schema(description = "Data de criação")
    private LocalDateTime createdAt;

    @Schema(description = "Data de atualização")
    private LocalDateTime updatedAt;
}
