package com.axonrh.timesheet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Response de resumo diario (espelho de ponto).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySummaryResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDate summaryDate;
    private String dayOfWeek;

    // Escala
    private UUID workScheduleId;
    private String workScheduleName;

    // Horarios registrados
    private LocalTime firstEntry;
    private LocalTime lastExit;
    private LocalTime breakStart;
    private LocalTime breakEnd;

    // Totais formatados
    private Integer expectedWorkMinutes;
    private String expectedWorkFormatted;
    private Integer workedMinutes;
    private String workedFormatted;
    private Integer breakMinutes;
    private String breakFormatted;
    private Integer overtimeMinutes;
    private String overtimeFormatted;
    private Integer deficitMinutes;
    private String deficitFormatted;
    private Integer nightShiftMinutes;
    private String nightShiftFormatted;

    // Atrasos
    private Integer lateArrivalMinutes;
    private String lateArrivalFormatted;
    private Integer earlyDepartureMinutes;
    private String earlyDepartureFormatted;

    // Status
    private Boolean isAbsent;
    private String absenceType;
    private String absenceTypeLabel;
    private Boolean hasPendingRecords;
    private Boolean hasMissingRecords;
    private Boolean isHoliday;
    private String holidayName;
    private Boolean isClosed;

    // Registros do dia
    private List<TimeRecordResponse> records;

    private String notes;

    // Balance (saldo do dia: overtime - deficit)
    private Integer balanceMinutes;
    private String balanceFormatted;
    private Boolean isPositive;
}
