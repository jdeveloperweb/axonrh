package com.axonrh.performance.dto;

import com.axonrh.performance.entity.DiscEvaluation;
import com.axonrh.performance.entity.enums.DiscAssessmentStatus;

import java.time.LocalDateTime;

public class DiscEvaluationDTO {

    private String id;
    private String employeeId;
    private String employeeName;
    private Integer dScore;
    private Integer iScore;
    private Integer sScore;
    private Integer cScore;
    private String primaryProfile;
    private String secondaryProfile;
    private String profileDescription;
    private String status;
    private String dueDate;
    private String completedAt;
    private String createdAt;

    public DiscEvaluationDTO() {}

    public static DiscEvaluationDTO fromEntity(DiscEvaluation entity) {
        DiscEvaluationDTO dto = new DiscEvaluationDTO();
        dto.setId(entity.getId().toString());
        dto.setEmployeeId(entity.getEmployeeId().toString());
        dto.setEmployeeName(entity.getEmployeeName());
        dto.setDScore(entity.getDScore());
        dto.setIScore(entity.getIScore());
        dto.setSScore(entity.getSScore());
        dto.setCScore(entity.getCScore());
        dto.setPrimaryProfile(entity.getPrimaryProfile() != null ? entity.getPrimaryProfile().name() : null);
        dto.setSecondaryProfile(entity.getSecondaryProfile() != null ? entity.getSecondaryProfile().name() : null);
        dto.setProfileDescription(entity.getProfileDescription());
        dto.setStatus(entity.getStatus().name());
        dto.setDueDate(entity.getDueDate() != null ? entity.getDueDate().toString() : null);
        dto.setCompletedAt(entity.getCompletedAt() != null ? entity.getCompletedAt().toString() : null);
        dto.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
        return dto;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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

    public Integer getDScore() {
        return dScore;
    }

    public void setDScore(Integer dScore) {
        this.dScore = dScore;
    }

    public Integer getIScore() {
        return iScore;
    }

    public void setIScore(Integer iScore) {
        this.iScore = iScore;
    }

    public Integer getSScore() {
        return sScore;
    }

    public void setSScore(Integer sScore) {
        this.sScore = sScore;
    }

    public Integer getCScore() {
        return cScore;
    }

    public void setCScore(Integer cScore) {
        this.cScore = cScore;
    }

    public String getPrimaryProfile() {
        return primaryProfile;
    }

    public void setPrimaryProfile(String primaryProfile) {
        this.primaryProfile = primaryProfile;
    }

    public String getSecondaryProfile() {
        return secondaryProfile;
    }

    public void setSecondaryProfile(String secondaryProfile) {
        this.secondaryProfile = secondaryProfile;
    }

    public String getProfileDescription() {
        return profileDescription;
    }

    public void setProfileDescription(String profileDescription) {
        this.profileDescription = profileDescription;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(String completedAt) {
        this.completedAt = completedAt;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
