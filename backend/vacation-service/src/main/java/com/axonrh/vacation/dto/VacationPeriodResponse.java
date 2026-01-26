package com.axonrh.vacation.dto;

import com.axonrh.vacation.entity.enums.VacationPeriodStatus;
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
public class VacationPeriodResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDate acquisitionStartDate;
    private LocalDate acquisitionEndDate;
    private LocalDate concessionStartDate;
    private LocalDate concessionEndDate;
    private Integer totalDays;
    private Integer usedDays;
    private Integer soldDays;
    private Integer remainingDays;
    private VacationPeriodStatus status;
    private String statusLabel;
    private boolean isExpired;
    private boolean isExpiringSoon;
    private Integer daysUntilExpiration;
}
