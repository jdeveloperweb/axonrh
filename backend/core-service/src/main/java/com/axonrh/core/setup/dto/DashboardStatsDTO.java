package com.axonrh.core.setup.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;
import java.util.List;

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

    // Diversity Metrics
    private double femaleRepresentation;
    private double diversityIndex;
    private double averageAge;
    
    // Chart Data Maps
    private java.util.Map<String, Long> genderDistribution;
    private java.util.Map<String, Long> raceDistribution;
    
    // Age Pyramid: Key=Gender, Value=Map<AgeRange, Count>
    private java.util.Map<String, java.util.Map<String, Long>> agePyramid;
    
    // Gender by Dept: Key=DeptName, Value=Map<Gender, Count>
    private java.util.Map<String, java.util.Map<String, Long>> genderByDepartment;

    // Hiring & Retention
    private java.util.Map<String, Double> turnoverHistory; // "Jan/25" -> 1.5
    private java.util.Map<String, Long> activeHistory; // "Jan/25" -> 150
    private java.util.Map<String, Long> hiringHistory; // "Jan/25" -> 5
    private java.util.Map<String, Long> terminationHistory; // "Jan/25" -> 2
    private java.util.Map<String, Long> tenureDistribution; // "< 1 ano" -> 10, ...
}
