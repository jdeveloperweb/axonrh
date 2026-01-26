package com.axonrh.performance.entity;

import com.axonrh.performance.entity.enums.PDIStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Plano de Desenvolvimento Individual.
 */
@Entity
@Table(name = "pdis")
public class PDI {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "manager_name")
    private String managerName;

    @Column(name = "evaluation_id")
    private UUID evaluationId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "objectives", columnDefinition = "TEXT")
    private String objectives;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PDIStatus status = PDIStatus.DRAFT;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "overall_progress")
    private Integer overallProgress = 0;

    @Column(name = "focus_areas", columnDefinition = "TEXT")
    private String focusAreas;

    @Column(name = "expected_outcomes", columnDefinition = "TEXT")
    private String expectedOutcomes;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "pdi", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dueDate ASC")
    private List<PDIAction> actions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Business methods
    public void activate() {
        if (this.status != PDIStatus.DRAFT) {
            throw new IllegalStateException("Apenas PDIs em rascunho podem ser ativados");
        }
        this.status = PDIStatus.ACTIVE;
        if (this.startDate == null) {
            this.startDate = LocalDate.now();
        }
    }

    public void approve(UUID approverId) {
        this.status = PDIStatus.ACTIVE;
        this.approvedAt = LocalDateTime.now();
        this.approvedBy = approverId;
    }

    public void complete() {
        this.status = PDIStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
        this.overallProgress = 100;
    }

    public void cancel() {
        this.status = PDIStatus.CANCELLED;
    }

    public void calculateProgress() {
        if (actions.isEmpty()) {
            this.overallProgress = 0;
            return;
        }

        long completedActions = actions.stream()
                .filter(a -> a.getStatus() == com.axonrh.performance.entity.enums.PDIActionStatus.COMPLETED)
                .count();

        this.overallProgress = (int) (completedActions * 100 / actions.size());

        if (this.overallProgress == 100 && this.status == PDIStatus.ACTIVE) {
            this.status = PDIStatus.COMPLETED;
            this.completedAt = LocalDateTime.now();
        }
    }

    public void addAction(PDIAction action) {
        action.setPdi(this);
        this.actions.add(action);
    }

    public void removeAction(PDIAction action) {
        this.actions.remove(action);
        action.setPdi(null);
    }

    public boolean isOverdue() {
        return endDate != null
                && LocalDate.now().isAfter(endDate)
                && status != PDIStatus.COMPLETED
                && status != PDIStatus.CANCELLED;
    }

    public int getDaysRemaining() {
        if (endDate == null) return Integer.MAX_VALUE;
        return (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), endDate);
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public UUID getManagerId() {
        return managerId;
    }

    public void setManagerId(UUID managerId) {
        this.managerId = managerId;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public UUID getEvaluationId() {
        return evaluationId;
    }

    public void setEvaluationId(UUID evaluationId) {
        this.evaluationId = evaluationId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getObjectives() {
        return objectives;
    }

    public void setObjectives(String objectives) {
        this.objectives = objectives;
    }

    public PDIStatus getStatus() {
        return status;
    }

    public void setStatus(PDIStatus status) {
        this.status = status;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public UUID getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(UUID approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public Integer getOverallProgress() {
        return overallProgress;
    }

    public void setOverallProgress(Integer overallProgress) {
        this.overallProgress = overallProgress;
    }

    public String getFocusAreas() {
        return focusAreas;
    }

    public void setFocusAreas(String focusAreas) {
        this.focusAreas = focusAreas;
    }

    public String getExpectedOutcomes() {
        return expectedOutcomes;
    }

    public void setExpectedOutcomes(String expectedOutcomes) {
        this.expectedOutcomes = expectedOutcomes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PDIAction> getActions() {
        return actions;
    }

    public void setActions(List<PDIAction> actions) {
        this.actions = actions;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
