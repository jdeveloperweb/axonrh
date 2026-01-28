package com.axonrh.employee.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionRequest {

    @NotBlank(message = "O código é obrigatório")
    @Size(max = 20, message = "O código deve ter no máximo 20 caracteres")
    @Schema(description = "Código do cargo", example = "DEV-01")
    private String code;

    @NotBlank(message = "O título é obrigatório")
    @Size(max = 100, message = "O título deve ter no máximo 100 caracteres")
    @Schema(description = "Título do cargo", example = "Desenvolvedor Backend Junior")
    private String title;

    @Schema(description = "Descrição do cargo")
    private String description;

    @Schema(description = "Responsabilidades do cargo")
    private String responsibilities;

    @Size(max = 10, message = "O CBO deve ter no máximo 10 caracteres")
    @Schema(description = "Código Brasileiro de Ocupações", example = "2124-05")
    private String cboCode;

    @Schema(description = "Salário mínimo da faixa", example = "4000.00")
    private BigDecimal salaryRangeMin;

    @Schema(description = "Salário máximo da faixa", example = "6000.00")
    private BigDecimal salaryRangeMax;

    @Size(max = 20, message = "O nível deve ter no máximo 20 caracteres")
    @Schema(description = "Nível hierárquico", example = "JUNIOR")
    private String level;

    @NotNull(message = "O departamento é obrigatório")
    @Schema(description = "ID do departamento vinculado")
    private UUID departmentId;
}
