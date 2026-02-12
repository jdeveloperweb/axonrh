package com.axonrh.vacation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VacationStatisticsResponse {
    private long pendingRequests;
    private long expiringPeriods;
    private long employeesOnVacation;
    private long upcomingVacations;
}
