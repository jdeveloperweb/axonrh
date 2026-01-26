package com.axonrh.timesheet.entity;

import com.axonrh.timesheet.entity.enums.ScheduleType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * T128 - Escala/jornada de trabalho.
 * Define os horarios de trabalho de um colaborador ou grupo.
 */
@Entity
@Table(name = "work_schedules", indexes = {
    @Index(name = "idx_work_schedules_tenant", columnList = "tenant_id"),
    @Index(name = "idx_work_schedules_name", columnList = "tenant_id, name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_type", nullable = false, length = 20)
    private ScheduleType scheduleType;

    // Carga horaria semanal em minutos
    @Column(name = "weekly_hours_minutes", nullable = false)
    private Integer weeklyHoursMinutes;

    // Tolerancia em minutos (padrao 5 min conforme CLT)
    @Column(name = "tolerance_minutes")
    @Builder.Default
    private Integer toleranceMinutes = 5;

    // Intervalo minimo obrigatorio em minutos (CLT: 1h para jornada > 6h)
    @Column(name = "min_break_minutes")
    @Builder.Default
    private Integer minBreakMinutes = 60;

    // Limite de horas extras diarias
    @Column(name = "max_daily_overtime_minutes")
    @Builder.Default
    private Integer maxDailyOvertimeMinutes = 120; // 2 horas

    // Horarios por dia da semana
    @OneToMany(mappedBy = "workSchedule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<ScheduleDay> scheduleDays = new ArrayList<>();

    // Vigencia
    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    // Configuracoes de banco de horas
    @Column(name = "overtime_bank_enabled")
    @Builder.Default
    private Boolean overtimeBankEnabled = false;

    @Column(name = "overtime_bank_expiration_months")
    @Builder.Default
    private Integer overtimeBankExpirationMonths = 6; // CLT padrao

    // Configuracoes de adicional noturno
    @Column(name = "night_shift_start")
    private LocalTime nightShiftStart;

    @Column(name = "night_shift_end")
    private LocalTime nightShiftEnd;

    @Column(name = "night_shift_additional_percent")
    @Builder.Default
    private Integer nightShiftAdditionalPercent = 20;

    // Sindicato/acordo coletivo
    @Column(name = "union_agreement_id")
    private UUID unionAgreementId;

    @Column(name = "union_agreement_name", length = 200)
    private String unionAgreementName;

    // Status
    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

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

    // Metodos de conveniencia
    public void addScheduleDay(ScheduleDay day) {
        scheduleDays.add(day);
        day.setWorkSchedule(this);
    }

    public void removeScheduleDay(ScheduleDay day) {
        scheduleDays.remove(day);
        day.setWorkSchedule(null);
    }
}
