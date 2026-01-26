package com.axonrh.timesheet.entity;

import com.axonrh.timesheet.entity.enums.RecordSource;
import com.axonrh.timesheet.entity.enums.RecordStatus;
import com.axonrh.timesheet.entity.enums.RecordType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * T127 - Registro de ponto.
 * Armazena cada marcacao de entrada, saida e intervalos.
 */
@Entity
@Table(name = "time_records", indexes = {
    @Index(name = "idx_time_records_employee_date", columnList = "employee_id, record_date"),
    @Index(name = "idx_time_records_tenant_date", columnList = "tenant_id, record_date"),
    @Index(name = "idx_time_records_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "record_time", nullable = false)
    private LocalTime recordTime;

    @Column(name = "record_datetime", nullable = false)
    private LocalDateTime recordDatetime;

    @Enumerated(EnumType.STRING)
    @Column(name = "record_type", nullable = false, length = 20)
    private RecordType recordType;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    private RecordSource source;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private RecordStatus status = RecordStatus.VALID;

    // Localizacao geografica
    @Column(name = "latitude", precision = 10)
    private Double latitude;

    @Column(name = "longitude", precision = 10)
    private Double longitude;

    @Column(name = "geofence_id")
    private UUID geofenceId;

    @Column(name = "within_geofence")
    private Boolean withinGeofence;

    @Column(name = "location_accuracy")
    private Double locationAccuracy;

    // Foto do registro (reconhecimento facial)
    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "facial_match_confidence")
    private Double facialMatchConfidence;

    // Dados do dispositivo
    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    // REP (Registrador Eletronico de Ponto)
    @Column(name = "rep_id", length = 50)
    private String repId;

    @Column(name = "nsr")
    private Long nsr; // Numero Sequencial de Registro

    // Observacoes e justificativas
    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    // Aprovacao manual
    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    // Referencia ao ajuste (se foi ajustado)
    @Column(name = "adjustment_id")
    private UUID adjustmentId;

    @Column(name = "original_time")
    private LocalTime originalTime;

    // Auditoria
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;
}
