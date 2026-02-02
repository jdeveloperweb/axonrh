package com.axonrh.timesheet.dto;

import com.axonrh.timesheet.entity.enums.ScheduleType;
import com.axonrh.timesheet.entity.enums.WorkRegime;
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
 * Request para criacao/edicao de escala de trabalho.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class WorkScheduleRequest {

    private UUID id;

    @NotBlank(message = "Nome da escala e obrigatorio")
    @Size(max = 100)
    private String name;

    @Size(max = 500)
    private String description;

    @NotNull(message = "Tipo de escala e obrigatorio")
    private ScheduleType scheduleType;

    private WorkRegime workRegime;

    @NotNull(message = "Carga horaria semanal e obrigatoria")
    private Integer weeklyHoursMinutes;

    private Integer toleranceMinutes;
    private Integer minBreakMinutes;
    private Integer maxDailyOvertimeMinutes;

    private LocalDate validFrom;
    private LocalDate validUntil;

    // Banco de horas
    private Boolean overtimeBankEnabled;
    private Integer overtimeBankExpirationMonths;

    // Adicional noturno
    private LocalTime nightShiftStart;
    private LocalTime nightShiftEnd;
    private Integer nightShiftAdditionalPercent;

    // Acordo coletivo
    private UUID unionAgreementId;
    private String unionAgreementName;

    // Horarios por dia da semana
    private List<ScheduleDayRequest> days;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class ScheduleDayRequest {
        private UUID id;
        @NotNull
        private String dayOfWeek; // MONDAY, TUESDAY, etc.
        private Boolean isWorkDay;
        private LocalTime entryTime;
        private LocalTime exitTime;
        private LocalTime breakStartTime;
        private LocalTime breakEndTime;
        private LocalTime break2StartTime;
        private LocalTime break2EndTime;
        private Integer expectedWorkMinutes;
        private Integer toleranceMinutes;
        private String notes;
    }
}
