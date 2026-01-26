package com.axonrh.timesheet.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Resumo diario de ponto (espelho de ponto).
 * Calculado a partir dos registros individuais.
 */
@Entity
@Table(name = "daily_summaries", indexes = {
    @Index(name = "idx_daily_summaries_employee_date", columnList = "employee_id, summary_date"),
    @Index(name = "idx_daily_summaries_tenant_date", columnList = "tenant_id, summary_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailySummary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "summary_date", nullable = false)
    private LocalDate summaryDate;

    // Escala do dia
    @Column(name = "work_schedule_id")
    private UUID workScheduleId;

    // Horarios registrados
    @Column(name = "first_entry")
    private LocalTime firstEntry;

    @Column(name = "last_exit")
    private LocalTime lastExit;

    @Column(name = "break_start")
    private LocalTime breakStart;

    @Column(name = "break_end")
    private LocalTime breakEnd;

    // Totais em minutos
    @Column(name = "expected_work_minutes")
    private Integer expectedWorkMinutes;

    @Column(name = "worked_minutes")
    @Builder.Default
    private Integer workedMinutes = 0;

    @Column(name = "break_minutes")
    @Builder.Default
    private Integer breakMinutes = 0;

    @Column(name = "overtime_minutes")
    @Builder.Default
    private Integer overtimeMinutes = 0;

    @Column(name = "deficit_minutes")
    @Builder.Default
    private Integer deficitMinutes = 0;

    @Column(name = "night_shift_minutes")
    @Builder.Default
    private Integer nightShiftMinutes = 0;

    // Atrasos e faltas
    @Column(name = "late_arrival_minutes")
    @Builder.Default
    private Integer lateArrivalMinutes = 0;

    @Column(name = "early_departure_minutes")
    @Builder.Default
    private Integer earlyDepartureMinutes = 0;

    @Column(name = "is_absent")
    @Builder.Default
    private Boolean isAbsent = false;

    @Column(name = "absence_type", length = 50)
    private String absenceType; // UNJUSTIFIED, VACATION, SICK_LEAVE, etc.

    // Status do dia
    @Column(name = "has_pending_records")
    @Builder.Default
    private Boolean hasPendingRecords = false;

    @Column(name = "has_missing_records")
    @Builder.Default
    private Boolean hasMissingRecords = false;

    @Column(name = "is_holiday")
    @Builder.Default
    private Boolean isHoliday = false;

    @Column(name = "holiday_name", length = 100)
    private String holidayName;

    // Fechamento
    @Column(name = "is_closed")
    @Builder.Default
    private Boolean isClosed = false;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by")
    private UUID closedBy;

    // Observacoes
    @Column(name = "notes", length = 1000)
    private String notes;

    // Auditoria
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
