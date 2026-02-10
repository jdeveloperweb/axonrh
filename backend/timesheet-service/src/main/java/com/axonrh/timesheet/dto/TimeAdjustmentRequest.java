package com.axonrh.timesheet.dto;

import com.axonrh.timesheet.entity.enums.RecordType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Request para solicitacao de ajuste de ponto.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TimeAdjustmentRequest {

    @NotNull(message = "Tipo de ajuste e obrigatorio")
    private String adjustmentType; // ADD, MODIFY, DELETE

    // Para MODIFY ou DELETE
    private UUID originalRecordId;

    @NotNull(message = "Data e obrigatoria")
    private LocalDate recordDate;

    @NotNull(message = "Tipo de registro e obrigatorio")
    private RecordType recordType;

    @NotNull(message = "Horario solicitado e obrigatorio")
    private LocalTime requestedTime;

    @NotBlank(message = "Justificativa e obrigatoria")
    @Size(min = 10, max = 1000, message = "Justificativa deve ter entre 10 e 1000 caracteres")
    private String justification;

    // Identificacao do colaborador (opcional no request, extraido do token no service)
    private UUID employeeId;
    private String employeeName;

    // URLs de anexos (comprovantes)
    private List<String> attachmentUrls;
}
