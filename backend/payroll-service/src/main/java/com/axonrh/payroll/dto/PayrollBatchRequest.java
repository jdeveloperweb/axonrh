package com.axonrh.payroll.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollBatchRequest {

    @NotNull(message = "Mes de referencia e obrigatorio")
    @Min(value = 1, message = "Mes deve ser entre 1 e 12")
    @Max(value = 12, message = "Mes deve ser entre 1 e 12")
    private Integer referenceMonth;

    @NotNull(message = "Ano de referencia e obrigatorio")
    @Min(value = 2020, message = "Ano deve ser maior que 2020")
    private Integer referenceYear;

    private List<UUID> employeeIds;

    private String description;
}
