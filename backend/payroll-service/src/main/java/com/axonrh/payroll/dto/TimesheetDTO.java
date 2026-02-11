package com.axonrh.payroll.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class TimesheetDTO {
    private BigDecimal regularHours;
    private BigDecimal overtime50Hours;
    private BigDecimal overtime100Hours;
    private BigDecimal nightShiftHours;
    private BigDecimal absenceDays;
    private BigDecimal workedDays;
    private Integer totalDaysInMonth;
}
