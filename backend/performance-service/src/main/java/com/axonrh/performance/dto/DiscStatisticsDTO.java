package com.axonrh.performance.dto;

public class DiscStatisticsDTO {

    private long totalEvaluations;
    private long completedEvaluations;
    private long pendingEvaluations;
    private long overdueEvaluations;
    private int dominanceCount;
    private int influenceCount;
    private int steadinessCount;
    private int conscientiousnessCount;

    public DiscStatisticsDTO() {}

    public DiscStatisticsDTO(long total, long completed, long pending, long overdue,
                            int dCount, int iCount, int sCount, int cCount) {
        this.totalEvaluations = total;
        this.completedEvaluations = completed;
        this.pendingEvaluations = pending;
        this.overdueEvaluations = overdue;
        this.dominanceCount = dCount;
        this.influenceCount = iCount;
        this.steadinessCount = sCount;
        this.conscientiousnessCount = cCount;
    }

    // Getters and Setters
    public long getTotalEvaluations() {
        return totalEvaluations;
    }

    public void setTotalEvaluations(long totalEvaluations) {
        this.totalEvaluations = totalEvaluations;
    }

    public long getCompletedEvaluations() {
        return completedEvaluations;
    }

    public void setCompletedEvaluations(long completedEvaluations) {
        this.completedEvaluations = completedEvaluations;
    }

    public long getPendingEvaluations() {
        return pendingEvaluations;
    }

    public void setPendingEvaluations(long pendingEvaluations) {
        this.pendingEvaluations = pendingEvaluations;
    }

    public long getOverdueEvaluations() {
        return overdueEvaluations;
    }

    public void setOverdueEvaluations(long overdueEvaluations) {
        this.overdueEvaluations = overdueEvaluations;
    }

    public int getDominanceCount() {
        return dominanceCount;
    }

    public void setDominanceCount(int dominanceCount) {
        this.dominanceCount = dominanceCount;
    }

    public int getInfluenceCount() {
        return influenceCount;
    }

    public void setInfluenceCount(int influenceCount) {
        this.influenceCount = influenceCount;
    }

    public int getSteadinessCount() {
        return steadinessCount;
    }

    public void setSteadinessCount(int steadinessCount) {
        this.steadinessCount = steadinessCount;
    }

    public int getConscientiousnessCount() {
        return conscientiousnessCount;
    }

    public void setConscientiousnessCount(int conscientiousnessCount) {
        this.conscientiousnessCount = conscientiousnessCount;
    }
}
