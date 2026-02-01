package com.axonrh.timesheet.dto;

import com.axonrh.timesheet.entity.enums.ScheduleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Response de escala de trabalho.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkScheduleResponse {

    private UUID id;
    private UUID tenantId;
    private String name;
    private String description;

    private ScheduleType scheduleType;
    private String scheduleTypeLabel;

    private Integer weeklyHoursMinutes;
    private String weeklyHoursFormatted; // "44h00"

    private Integer toleranceMinutes;
    private Integer minBreakMinutes;
    private Integer maxDailyOvertimeMinutes;

    private LocalDate validFrom;
    private LocalDate validUntil;

    private Boolean overtimeBankEnabled;
    private Integer overtimeBankExpirationMonths;

    private LocalTime nightShiftStart;
    private LocalTime nightShiftEnd;
    private Integer nightShiftAdditionalPercent;

    private UUID unionAgreementId;
    private String unionAgreementName;

    private Boolean active;

    private List<ScheduleDayResponse> days;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleDayResponse {
        private UUID id;
        private DayOfWeek dayOfWeek;
        private String dayOfWeekLabel;
        private Boolean isWorkDay;
        private LocalTime entryTime;
        private LocalTime exitTime;
        private LocalTime breakStartTime;
        private LocalTime breakEndTime;
        private LocalTime break2StartTime;
        private LocalTime break2EndTime;
        private Integer expectedWorkMinutes;
        private String expectedWorkFormatted;
        private Integer toleranceMinutes;
        private String notes;
    }
}
