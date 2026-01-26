package com.axonrh.timesheet.dto;

import com.axonrh.timesheet.entity.enums.RecordSource;
import com.axonrh.timesheet.entity.enums.RecordType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Request para registro de ponto.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeRecordRequest {

    @NotNull(message = "ID do colaborador e obrigatorio")
    private UUID employeeId;

    private LocalDate recordDate; // Se nulo, usa data atual

    private LocalTime recordTime; // Se nulo, usa hora atual

    @NotNull(message = "Tipo de registro e obrigatorio")
    private RecordType recordType;

    @NotNull(message = "Origem do registro e obrigatoria")
    private RecordSource source;

    // Localizacao
    private Double latitude;
    private Double longitude;
    private Double locationAccuracy;

    // Foto (Base64 ou URL)
    private String photoBase64;
    private String photoUrl;

    // Dados do dispositivo
    private String deviceId;
    private String deviceInfo;
    private String ipAddress;

    // WiFi (para validacao)
    private String wifiSsid;
    private String wifiBssid;

    // Observacoes
    private String notes;
}
