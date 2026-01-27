package com.axonrh.performance.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Atualizacao de progresso de meta.
 */
@Entity
@Table(name = "goal_updates")
public class GoalUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    @Column(name = "previous_value", precision = 15, scale = 2)
    private BigDecimal previousValue;

    @Column(name = "new_value", precision = 15, scale = 2)
    private BigDecimal newValue;

    @Column(name = "previous_progress", precision = 5, scale = 2)
    private BigDecimal previousProgress;

    @Column(name = "new_progress", precision = 5, scale = 2)
    private BigDecimal newProgress;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by")
    private UUID updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Goal getGoal() {
        return goal;
    }

    public void setGoal(Goal goal) {
        this.goal = goal;
    }

    public BigDecimal getPreviousValue() {
        return previousValue;
    }

    public void setPreviousValue(BigDecimal previousValue) {
        this.previousValue = previousValue;
    }

    public BigDecimal getNewValue() {
        return newValue;
    }

    public void setNewValue(BigDecimal newValue) {
        this.newValue = newValue;
    }

    public BigDecimal getPreviousProgress() {
        return previousProgress;
    }

    public void setPreviousProgress(BigDecimal previousProgress) {
        this.previousProgress = previousProgress;
    }

    public BigDecimal getNewProgress() {
        return newProgress;
    }

    public void setNewProgress(BigDecimal newProgress) {
        this.newProgress = newProgress;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
