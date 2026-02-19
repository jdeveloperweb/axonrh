package com.axonrh.vacation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveDashboardDTO {
    private long totalEmployees;
    private long employeesOnLeave;
    private long maleEmployees;
    private long femaleEmployees;
    
    private double averageAge;
    private double maleAverageAge;
    private double femaleAverageAge;

    private long medicalLeavesCount;
    private long maleMedicalLeavesCount;
    private long femaleMedicalLeavesCount;
    private double medicalLeavePercentage;

    private List<GenerationStat> generations;
    private List<GenderStat> genderDistribution;
    private List<ReasonStat> reasonDistribution;
    private List<CidStat> cidDistribution;
    private List<MonthlyStat> monthlyTrend;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class GenerationStat {
        private String name;
        private long count;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class GenderStat {
        private String gender;
        private long count;
        private double percentage;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReasonStat {
        private String reason;
        private long count;
        private double percentage;
        private long employeesCount;
        private long currentOnLeave;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CidStat {
        private String chapter;
        private String cid;
        private String description;
        private long count;
        private int year;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthlyStat {
        private String mouth;
        private int year;
        private long count;
    }
}
