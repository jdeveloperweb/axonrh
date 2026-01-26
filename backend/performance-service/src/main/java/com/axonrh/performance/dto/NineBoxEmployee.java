package com.axonrh.performance.dto;

import java.math.BigDecimal;

/**
 * Colaborador na matriz 9Box.
 */
public class NineBoxEmployee {

    private String employeeId;
    private String employeeName;
    private String departmentName;
    private String positionTitle;
    private String photoUrl;

    private BigDecimal performanceScore;
    private BigDecimal potentialScore;
    private int performanceLevel; // 1-3
    private int potentialLevel;   // 1-3

    private NineBoxPosition position;
    private String evaluationId;

    public NineBoxEmployee() {}

    public NineBoxEmployee(String employeeId, String employeeName,
                          BigDecimal performanceScore, BigDecimal potentialScore) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.performanceScore = performanceScore;
        this.potentialScore = potentialScore;
        this.performanceLevel = calculateLevel(performanceScore);
        this.potentialLevel = calculateLevel(potentialScore);
        this.position = determinePosition();
    }

    private int calculateLevel(BigDecimal score) {
        if (score == null) return 2;
        double value = score.doubleValue();
        if (value >= 4.0) return 3; // Alto
        if (value >= 2.5) return 2; // Medio
        return 1; // Baixo
    }

    private NineBoxPosition determinePosition() {
        return switch (performanceLevel) {
            case 3 -> switch (potentialLevel) {
                case 1 -> NineBoxPosition.WORKHORSE;
                case 2 -> NineBoxPosition.KEY_PLAYER;
                case 3 -> NineBoxPosition.STAR;
                default -> NineBoxPosition.CORE;
            };
            case 2 -> switch (potentialLevel) {
                case 1 -> NineBoxPosition.SOLID_PERFORMER;
                case 2 -> NineBoxPosition.CORE;
                case 3 -> NineBoxPosition.HIGH_POTENTIAL;
                default -> NineBoxPosition.CORE;
            };
            case 1 -> switch (potentialLevel) {
                case 1 -> NineBoxPosition.UNDERPERFORMER;
                case 2 -> NineBoxPosition.DILEMMA;
                case 3 -> NineBoxPosition.FUTURE_STAR;
                default -> NineBoxPosition.UNDERPERFORMER;
            };
            default -> NineBoxPosition.CORE;
        };
    }

    // Getters and Setters
    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getPositionTitle() {
        return positionTitle;
    }

    public void setPositionTitle(String positionTitle) {
        this.positionTitle = positionTitle;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public BigDecimal getPerformanceScore() {
        return performanceScore;
    }

    public void setPerformanceScore(BigDecimal performanceScore) {
        this.performanceScore = performanceScore;
        this.performanceLevel = calculateLevel(performanceScore);
        this.position = determinePosition();
    }

    public BigDecimal getPotentialScore() {
        return potentialScore;
    }

    public void setPotentialScore(BigDecimal potentialScore) {
        this.potentialScore = potentialScore;
        this.potentialLevel = calculateLevel(potentialScore);
        this.position = determinePosition();
    }

    public int getPerformanceLevel() {
        return performanceLevel;
    }

    public int getPotentialLevel() {
        return potentialLevel;
    }

    public NineBoxPosition getPosition() {
        return position;
    }

    public String getEvaluationId() {
        return evaluationId;
    }

    public void setEvaluationId(String evaluationId) {
        this.evaluationId = evaluationId;
    }
}
