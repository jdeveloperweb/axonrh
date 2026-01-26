package com.axonrh.timesheet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response de geofence.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeofenceResponse {

    private UUID id;
    private String name;
    private String description;

    private Double latitude;
    private Double longitude;
    private Integer radiusMeters;

    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String fullAddress;

    private String locationType;
    private String locationTypeLabel;

    private List<UUID> departmentIds;
    private List<String> departmentNames;
    private List<UUID> employeeIds;

    private Boolean requireWifi;
    private String wifiSsid;

    private Boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
