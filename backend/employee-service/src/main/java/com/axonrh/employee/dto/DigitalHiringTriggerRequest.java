package com.axonrh.employee.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

/**
 * DTO para disparar contratacao digital a partir do recrutamento.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalHiringTriggerRequest {

    @NotNull(message = "ID do candidato e obrigatorio")
    private UUID candidateId;

    private UUID vacancyId;
}
