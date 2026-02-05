package com.axonrh.employee.dto;

import com.axonrh.employee.entity.enums.EmploymentType;
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

/**
 * DTO para exibição pública da vaga (sem dados sensíveis)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicVacancyResponse {

    @Schema(description = "ID da vaga")
    private UUID id;

    @Schema(description = "Código público da vaga")
    private String publicCode;

    @Schema(description = "Título da vaga")
    private String title;

    @Schema(description = "Nome do cargo")
    private String positionTitle;

    @Schema(description = "Nome do departamento")
    private String departmentName;

    @Schema(description = "Descrição detalhada")
    private String description;

    @Schema(description = "Responsabilidades")
    private String responsibilities;

    @Schema(description = "Requisitos")
    private String requirements;

    @Schema(description = "Benefícios")
    private String benefits;

    @Schema(description = "Tipo de contratação")
    private EmploymentType employmentType;

    @Schema(description = "Regime de trabalho")
    private WorkRegime workRegime;

    @Schema(description = "Localização")
    private String location;

    @Schema(description = "Salário mínimo (se não oculto)")
    private BigDecimal salaryRangeMin;

    @Schema(description = "Salário máximo (se não oculto)")
    private BigDecimal salaryRangeMax;

    @Schema(description = "Data limite para candidatura")
    private LocalDate deadline;

    @Schema(description = "Data de publicação")
    private LocalDateTime publishedAt;

    @Schema(description = "Nome da empresa")
    private String companyName;

    @Schema(description = "Logo da empresa")
    private String companyLogo;
}
