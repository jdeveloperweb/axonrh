package com.axonrh.performance.dto;

import com.axonrh.performance.entity.DiscAssignment;

public class DiscAssignmentDTO {

    private String id;
    private String employeeId;
    private String employeeName;
    private String assignedBy;
    private String assignedByName;
    private String dueDate;
    private String status;
    private String evaluationId;
    private String createdAt;
    private String completedAt;

    public DiscAssignmentDTO() {}

    public static DiscAssignmentDTO fromEntity(DiscAssignment entity) {
        DiscAssignmentDTO dto = new DiscAssignmentDTO();
        dto.setId(entity.getId().toString());
        dto.setEmployeeId(entity.getEmployeeId().toString());
        dto.setEmployeeName(entity.getEmployeeName());
        dto.setAssignedBy(entity.getAssignedBy().toString());
        dto.setAssignedByName(entity.getAssignedByName());
        dto.setDueDate(entity.getDueDate() != null ? entity.getDueDate().toString() : null);
        dto.setStatus(entity.getStatus().name());
        dto.setEvaluationId(entity.getEvaluationId() != null ? entity.getEvaluationId().toString() : null);
        dto.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
        dto.setCompletedAt(entity.getCompletedAt() != null ? entity.getCompletedAt().toString() : null);
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

    public String getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
    }

    public String getAssignedByName() {
        return assignedByName;
    }

    public void setAssignedByName(String assignedByName) {
        this.assignedByName = assignedByName;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getEvaluationId() {
        return evaluationId;
    }

    public void setEvaluationId(String evaluationId) {
        this.evaluationId = evaluationId;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(String completedAt) {
        this.completedAt = completedAt;
    }
}
