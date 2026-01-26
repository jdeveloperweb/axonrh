package com.axonrh.timesheet.dto;

import com.axonrh.timesheet.entity.enums.RecordSource;
import com.axonrh.timesheet.entity.enums.RecordStatus;
import com.axonrh.timesheet.entity.enums.RecordType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Response de registro de ponto.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeRecordResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;

    private LocalDate recordDate;
    private LocalTime recordTime;
    private LocalDateTime recordDatetime;

    private RecordType recordType;
    private String recordTypeLabel;

    private RecordSource source;
    private String sourceLabel;

    private RecordStatus status;
    private String statusLabel;

    // Localizacao
    private Double latitude;
    private Double longitude;
    private UUID geofenceId;
    private String geofenceName;
    private Boolean withinGeofence;

    // Foto
    private String photoUrl;
    private Double facialMatchConfidence;

    // Dispositivo
    private String deviceInfo;

    // Ajuste
    private UUID adjustmentId;
    private LocalTime originalTime;

    // Aprovacao
    private String rejectionReason;
    private UUID approvedBy;
    private String approvedByName;
    private LocalDateTime approvedAt;

    private String notes;
    private LocalDateTime createdAt;
}
