package com.axonrh.timesheet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Request para criacao/edicao de geofence.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeofenceRequest {

    @NotBlank(message = "Nome e obrigatorio")
    @Size(max = 100)
    private String name;

    @Size(max = 500)
    private String description;

    @NotNull(message = "Latitude e obrigatoria")
    private Double latitude;

    @NotNull(message = "Longitude e obrigatoria")
    private Double longitude;

    private Integer radiusMeters;

    // Endereco
    private String address;
    private String city;
    private String state;
    private String zipCode;

    private String locationType; // HEADQUARTERS, BRANCH, CLIENT, HOME_OFFICE, OTHER

    // Restricoes
    private List<UUID> departmentIds;
    private List<UUID> employeeIds;

    // WiFi
    private Boolean requireWifi;
    private String wifiSsid;
    private String wifiBssid;

    private Boolean active;
}
