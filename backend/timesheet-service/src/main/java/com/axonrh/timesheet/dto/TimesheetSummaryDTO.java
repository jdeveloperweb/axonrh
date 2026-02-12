package com.axonrh.timesheet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimesheetSummaryDTO {
    private BigDecimal regularHours;
    private BigDecimal overtime50Hours;
    private BigDecimal overtime100Hours;
    private BigDecimal nightShiftHours;
    private BigDecimal absenceDays;
    private BigDecimal workedDays;
    private Integer totalDaysInMonth;
}
