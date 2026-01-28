package com.axonrh.core.setup.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private long totalEmployees;
    private long presentToday;
    private long vacationsThisMonth;
    private long pendingIssues;
    
    private double employeeChange;
    private double presenceChange;
    private double pendingChange;
}
