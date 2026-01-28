package com.axonrh.learning.service.dto;

import com.axonrh.learning.entity.enums.EnrollmentStatus;
import java.math.BigDecimal;
import java.util.Map;
import java.util.List;

public class LearningDashboardDTO {
    private Long totalActiveEnrollments;
    private Long completionsThisMonth;
    private Double averageProgress;
    private Double totalTrainingHours;
    private Map<String, Long> statusDistribution;
    private List<MonthlyMetric> monthlyActivity;

    // Inner class for monthly data
    public static class MonthlyMetric {
        private String month;
        private Long completions;
        private Long enrollments;

        public MonthlyMetric() {}
        public MonthlyMetric(String month, Long completions, Long enrollments) {
            this.month = month;
            this.completions = completions;
            this.enrollments = enrollments;
        }

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        public Long getCompletions() { return completions; }
        public void setCompletions(Long completions) { this.completions = completions; }
        public Long getEnrollments() { return enrollments; }
        public void setEnrollments(Long enrollments) { this.enrollments = enrollments; }
    }

    public LearningDashboardDTO() {}

    public Long getTotalActiveEnrollments() { return totalActiveEnrollments; }
    public void setTotalActiveEnrollments(Long totalActiveEnrollments) { this.totalActiveEnrollments = totalActiveEnrollments; }

    public Long getCompletionsThisMonth() { return completionsThisMonth; }
    public void setCompletionsThisMonth(Long completionsThisMonth) { this.completionsThisMonth = completionsThisMonth; }

    public Double getAverageProgress() { return averageProgress; }
    public void setAverageProgress(Double averageProgress) { this.averageProgress = averageProgress; }

    public Double getTotalTrainingHours() { return totalTrainingHours; }
    public void setTotalTrainingHours(Double totalTrainingHours) { this.totalTrainingHours = totalTrainingHours; }

    public Map<String, Long> getStatusDistribution() { return statusDistribution; }
    public void setStatusDistribution(Map<String, Long> statusDistribution) { this.statusDistribution = statusDistribution; }

    public List<MonthlyMetric> getMonthlyActivity() { return monthlyActivity; }
    public void setMonthlyActivity(List<MonthlyMetric> monthlyActivity) { this.monthlyActivity = monthlyActivity; }
}
