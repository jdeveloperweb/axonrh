package com.axonrh.employee.dto;

import com.axonrh.employee.entity.enums.EmploymentType;
import com.axonrh.employee.entity.enums.VacancyStatus;
import com.axonrh.employee.entity.enums.VacancyType;
import com.axonrh.employee.entity.enums.WorkRegime;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobVacancyResponse {

    @Schema(description = "ID da vaga")
    private UUID id;

    @Schema(description = "ID do cargo vinculado")
    private UUID positionId;

    @Schema(description = "Código do cargo")
    private String positionCode;

    @Schema(description = "Título do cargo")
    private String positionTitle;

    @Schema(description = "Nome do departamento")
    private String departmentName;

    @Schema(description = "Título da vaga")
    private String title;

    @Schema(description = "Descrição detalhada")
    private String description;

    @Schema(description = "Responsabilidades")
    private String responsibilities;

    @Schema(description = "Requisitos")
    private String requirements;

    @Schema(description = "Benefícios")
    private String benefits;

    @Schema(description = "Tipo da vaga")
    private VacancyType vacancyType;

    @Schema(description = "Tipo de contratação")
    private EmploymentType employmentType;

    @Schema(description = "Regime de trabalho")
    private WorkRegime workRegime;

    @Schema(description = "Localização")
    private String location;

    @Schema(description = "Salário mínimo")
    private BigDecimal salaryRangeMin;

    @Schema(description = "Salário máximo")
    private BigDecimal salaryRangeMax;

    @Schema(description = "Ocultar salário")
    private Boolean hideSalary;

    @Schema(description = "Máximo de candidatos")
    private Integer maxCandidates;

    @Schema(description = "Data limite")
    private LocalDate deadline;

    @Schema(description = "Status da vaga")
    private VacancyStatus status;

    @Schema(description = "Data de publicação")
    private LocalDateTime publishedAt;

    @Schema(description = "Data de fechamento")
    private LocalDateTime closedAt;

    @Schema(description = "Código público para URL")
    private String publicCode;

    @Schema(description = "Número de candidatos inscritos")
    private Integer candidateCount;

    @Schema(description = "Vaga está ativa")
    private Boolean isActive;

    @Schema(description = "Data de criação")
    private LocalDateTime createdAt;

    @Schema(description = "Data de atualização")
    private LocalDateTime updatedAt;
}
