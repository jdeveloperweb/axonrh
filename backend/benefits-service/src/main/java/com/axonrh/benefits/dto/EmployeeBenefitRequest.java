package com.axonrh.benefits.dto;

import jakarta.validation.constraints.DecimalMin;
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
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeBenefitRequest {

    @NotNull(message = "ID do colaborador e obrigatorio")
    private UUID employeeId;

    @NotBlank(message = "Nome do colaborador e obrigatorio")
    @Size(max = 200, message = "Nome deve ter no maximo 200 caracteres")
    private String employeeName;

    @NotNull(message = "ID do tipo de beneficio e obrigatorio")
    private UUID benefitTypeId;

    @DecimalMin(value = "0.01", message = "Valor fixo deve ser maior que zero")
    private BigDecimal fixedValue;

    @DecimalMin(value = "0.01", message = "Percentual deve ser maior que zero")
    private BigDecimal percentage;

    @NotNull(message = "Data de inicio e obrigatoria")
    private LocalDate startDate;

    private LocalDate endDate;

    @Size(max = 1000, message = "Observacoes devem ter no maximo 1000 caracteres")
    private String notes;
}
