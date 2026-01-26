package com.axonrh.vacation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VacationRequestCreateDTO {

    private UUID vacationPeriodId;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean fractioned;
    private Integer fractionNumber;
    private boolean sellDays;
    private Integer soldDaysCount;
    private boolean advance13thSalary;
    private String notes;
}
