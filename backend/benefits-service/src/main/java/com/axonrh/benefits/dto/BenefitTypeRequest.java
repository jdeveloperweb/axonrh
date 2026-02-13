package com.axonrh.benefits.dto;

import com.axonrh.benefits.enums.BenefitCategory;
import com.axonrh.benefits.enums.CalculationType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenefitTypeRequest {

    @NotBlank(message = "Nome do beneficio e obrigatorio")
    @Size(max = 150, message = "Nome deve ter no maximo 150 caracteres")
    private String name;

    @Size(max = 500, message = "Descricao deve ter no maximo 500 caracteres")
    private String description;

    @NotNull(message = "Categoria e obrigatoria")
    private BenefitCategory category;

    @NotNull(message = "Tipo de calculo e obrigatorio")
    private CalculationType calculationType;

    @DecimalMin(value = "0.00", message = "Valor padrao deve ser positivo")
    private BigDecimal defaultValue;

    @DecimalMin(value = "0.00", message = "Percentual padrao deve ser positivo")
    private BigDecimal defaultPercentage;
}
