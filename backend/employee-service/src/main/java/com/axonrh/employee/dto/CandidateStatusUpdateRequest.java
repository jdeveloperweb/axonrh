package com.axonrh.employee.dto;

import com.axonrh.employee.entity.enums.CandidateStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateStatusUpdateRequest {

    @NotNull(message = "O status é obrigatório")
    @Schema(description = "Novo status do candidato")
    private CandidateStatus status;

    @Schema(description = "Notas sobre a mudança de status")
    private String notes;

    @Min(value = 1, message = "A avaliação deve ser entre 1 e 5")
    @Max(value = 5, message = "A avaliação deve ser entre 1 e 5")
    @Schema(description = "Avaliação do candidato (1-5)")
    private Integer rating;
}
