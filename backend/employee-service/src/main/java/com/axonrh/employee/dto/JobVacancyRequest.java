package com.axonrh.employee.dto;

import com.axonrh.employee.entity.enums.EmploymentType;
import com.axonrh.employee.entity.enums.VacancyType;
import com.axonrh.employee.entity.enums.WorkRegime;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobVacancyRequest {

    @NotNull(message = "O cargo é obrigatório")
    @Schema(description = "ID do cargo vinculado")
    private UUID positionId;

    @NotBlank(message = "O título é obrigatório")
    @Size(max = 200, message = "O título deve ter no máximo 200 caracteres")
    @Schema(description = "Título da vaga", example = "Desenvolvedor Backend Sênior")
    private String title;

    @Schema(description = "Descrição detalhada da vaga")
    private String description;

    @Schema(description = "Responsabilidades do cargo")
    private String responsibilities;

    @Schema(description = "Requisitos necessários")
    private String requirements;

    @Schema(description = "Benefícios oferecidos")
    private String benefits;

    @Schema(description = "Tipo da vaga", example = "EXTERNAL")
    private VacancyType vacancyType;

    @Schema(description = "Tipo de contratação", example = "CLT")
    private EmploymentType employmentType;

    @Schema(description = "Regime de trabalho", example = "HIBRIDO")
    private WorkRegime workRegime;

    @Size(max = 200, message = "A localização deve ter no máximo 200 caracteres")
    @Schema(description = "Localização da vaga", example = "São Paulo, SP")
    private String location;

    @Schema(description = "Salário mínimo da faixa", example = "8000.00")
    private BigDecimal salaryRangeMin;

    @Schema(description = "Salário máximo da faixa", example = "12000.00")
    private BigDecimal salaryRangeMax;

    @Schema(description = "Ocultar salário na vaga pública")
    private Boolean hideSalary;

    @Schema(description = "Número máximo de candidatos (0 = sem limite)")
    private Integer maxCandidates;

    @Schema(description = "Data limite para candidaturas")
    private LocalDate deadline;
}
