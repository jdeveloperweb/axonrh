package com.axonrh.timesheet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Horario de trabalho para um dia especifico da semana.
 */
@Entity
@Table(name = "schedule_days")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleDay {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_schedule_id", nullable = false)
    private WorkSchedule workSchedule;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 15)
    private DayOfWeek dayOfWeek;

    // Indica se eh dia de trabalho
    @Column(name = "is_work_day")
    @Builder.Default
    private Boolean isWorkDay = true;

    // Horario de entrada
    @Column(name = "entry_time")
    private LocalTime entryTime;

    // Horario de saida
    @Column(name = "exit_time")
    private LocalTime exitTime;

    // Intervalo
    @Column(name = "break_start_time")
    private LocalTime breakStartTime;

    @Column(name = "break_end_time")
    private LocalTime breakEndTime;

    // Segundo intervalo (se houver)
    @Column(name = "break2_start_time")
    private LocalTime break2StartTime;

    @Column(name = "break2_end_time")
    private LocalTime break2EndTime;

    // Horas de trabalho esperadas em minutos
    @Column(name = "expected_work_minutes")
    private Integer expectedWorkMinutes;

    // Tolerancia especifica para este dia (se diferente da escala)
    @Column(name = "tolerance_minutes")
    private Integer toleranceMinutes;

    // Observacoes
    @Column(name = "notes", length = 255)
    private String notes;
}
