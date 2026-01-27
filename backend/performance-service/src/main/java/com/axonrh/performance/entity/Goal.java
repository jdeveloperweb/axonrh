package com.axonrh.performance.entity;

import com.axonrh.performance.entity.enums.GoalStatus;
import com.axonrh.performance.entity.enums.GoalType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Meta individual ou de equipe.
 */
@Entity
@Table(name = "goals")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "cycle_id")
    private UUID cycleId;

    @Column(name = "employee_id")
    private UUID employeeId;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal_type", nullable = false)
    private GoalType goalType = GoalType.INDIVIDUAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GoalStatus status = GoalStatus.NOT_STARTED;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(name = "target_value", precision = 15, scale = 2)
    private BigDecimal targetValue;

    @Column(name = "current_value", precision = 15, scale = 2)
    private BigDecimal currentValue = BigDecimal.ZERO;

    @Column(name = "unit_of_measure")
    private String unitOfMeasure;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "progress_percentage", precision = 5, scale = 2)
    private BigDecimal progressPercentage = BigDecimal.ZERO;

    @Column(name = "is_key_result")
    private Boolean isKeyResult = false;

    @Column(name = "parent_goal_id")
    private UUID parentGoalId;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "owner_name")
    private String ownerName;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<GoalUpdate> updates = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Business methods
    public void updateProgress(BigDecimal newValue, String notes, UUID updatedBy) {
        BigDecimal previousValue = this.currentValue;
        BigDecimal previousProgress = this.progressPercentage;

        this.currentValue = newValue;
        calculateProgressPercentage();
        updateStatus();

        GoalUpdate update = new GoalUpdate();
        update.setGoal(this);
        update.setPreviousValue(previousValue);
        update.setNewValue(newValue);
        update.setPreviousProgress(previousProgress);
        update.setNewProgress(this.progressPercentage);
        update.setNotes(notes);
        update.setUpdatedBy(updatedBy);
        this.updates.add(update);
    }

    private void calculateProgressPercentage() {
        if (targetValue == null || targetValue.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }
        this.progressPercentage = currentValue
                .divide(targetValue, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .min(BigDecimal.valueOf(100));
    }

    private void updateStatus() {
        if (progressPercentage.compareTo(BigDecimal.valueOf(100)) >= 0) {
            this.status = GoalStatus.COMPLETED;
            this.completedAt = LocalDateTime.now();
        } else if (progressPercentage.compareTo(BigDecimal.ZERO) > 0) {
            this.status = GoalStatus.IN_PROGRESS;
        }
    }

    public void complete() {
        this.status = GoalStatus.COMPLETED;
        this.progressPercentage = BigDecimal.valueOf(100);
        this.completedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = GoalStatus.CANCELLED;
    }

    public boolean isOverdue() {
        return dueDate != null
                && LocalDate.now().isAfter(dueDate)
                && status != GoalStatus.COMPLETED
                && status != GoalStatus.CANCELLED;
    }

    public boolean isOnTrack() {
        if (dueDate == null || startDate == null) return true;

        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(startDate, dueDate);
        long elapsedDays = java.time.temporal.ChronoUnit.DAYS.between(startDate, LocalDate.now());

        if (totalDays <= 0) return true;

        double expectedProgress = (double) elapsedDays / totalDays * 100;
        return progressPercentage.doubleValue() >= expectedProgress - 10;
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

    public UUID getCycleId() {
        return cycleId;
    }

    public void setCycleId(UUID cycleId) {
        this.cycleId = cycleId;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public UUID getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(UUID departmentId) {
        this.departmentId = departmentId;
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

    public GoalType getGoalType() {
        return goalType;
    }

    public void setGoalType(GoalType goalType) {
        this.goalType = goalType;
    }

    public GoalStatus getStatus() {
        return status;
    }

    public void setStatus(GoalStatus status) {
        this.status = status;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public BigDecimal getTargetValue() {
        return targetValue;
    }

    public void setTargetValue(BigDecimal targetValue) {
        this.targetValue = targetValue;
    }

    public BigDecimal getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(BigDecimal currentValue) {
        this.currentValue = currentValue;
    }

    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }

    public void setUnitOfMeasure(String unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public BigDecimal getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(BigDecimal progressPercentage) {
        this.progressPercentage = progressPercentage;
    }

    public Boolean getIsKeyResult() {
        return isKeyResult;
    }

    public void setIsKeyResult(Boolean isKeyResult) {
        this.isKeyResult = isKeyResult;
    }

    public UUID getParentGoalId() {
        return parentGoalId;
    }

    public void setParentGoalId(UUID parentGoalId) {
        this.parentGoalId = parentGoalId;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public List<GoalUpdate> getUpdates() {
        return updates;
    }

    public void setUpdates(List<GoalUpdate> updates) {
        this.updates = updates;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
