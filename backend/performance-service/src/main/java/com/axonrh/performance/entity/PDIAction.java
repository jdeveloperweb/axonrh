package com.axonrh.performance.entity;

import com.axonrh.performance.entity.enums.PDIActionStatus;
import com.axonrh.performance.entity.enums.PDIActionType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Acao de um PDI.
 */
@Entity
@Table(name = "pdi_actions")
public class PDIAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pdi_id", nullable = false)
    private PDI pdi;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private PDIActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PDIActionStatus status = PDIActionStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "competency_id")
    private UUID competencyId;

    @Column(name = "competency_name")
    private String competencyName;

    @Column(name = "resource_url")
    private String resourceUrl;

    @Column(name = "resource_name")
    private String resourceName;

    @Column(name = "progress")
    private Integer progress = 0;

    @Column(name = "estimated_hours")
    private Integer estimatedHours;

    @Column(name = "actual_hours")
    private Integer actualHours;

    @Column(name = "mentor_id")
    private UUID mentorId;

    @Column(name = "mentor_name")
    private String mentorName;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "completion_notes", columnDefinition = "TEXT")
    private String completionNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Business methods
    public void start() {
        if (this.status != PDIActionStatus.PENDING) {
            throw new IllegalStateException("Acao ja foi iniciada");
        }
        this.status = PDIActionStatus.IN_PROGRESS;
        if (this.progress == null || this.progress == 0) {
            this.progress = 10;
        }
    }

    public void complete(String notes, Integer hoursSpent) {
        this.status = PDIActionStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
        this.completionNotes = notes;
        this.actualHours = hoursSpent;
        this.progress = 100;

        if (pdi != null) {
            pdi.calculateProgress();
        }
    }

    public void cancel() {
        this.status = PDIActionStatus.CANCELLED;
    }

    public boolean isOverdue() {
        return dueDate != null
                && LocalDate.now().isAfter(dueDate)
                && status != PDIActionStatus.COMPLETED
                && status != PDIActionStatus.CANCELLED;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public PDI getPdi() {
        return pdi;
    }

    public void setPdi(PDI pdi) {
        this.pdi = pdi;
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

    public PDIActionType getActionType() {
        return actionType;
    }

    public void setActionType(PDIActionType actionType) {
        this.actionType = actionType;
    }

    public PDIActionStatus getStatus() {
        return status;
    }

    public void setStatus(PDIActionStatus status) {
        this.status = status;
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

    public UUID getCompetencyId() {
        return competencyId;
    }

    public void setCompetencyId(UUID competencyId) {
        this.competencyId = competencyId;
    }

    public String getCompetencyName() {
        return competencyName;
    }

    public void setCompetencyName(String competencyName) {
        this.competencyName = competencyName;
    }

    public String getResourceUrl() {
        return resourceUrl;
    }

    public void setResourceUrl(String resourceUrl) {
        this.resourceUrl = resourceUrl;
    }

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
        if (this.progress != null) {
            if (this.progress >= 100) {
                this.status = PDIActionStatus.COMPLETED;
                if (this.completedAt == null) this.completedAt = LocalDateTime.now();
            } else if (this.progress > 0) {
                this.status = PDIActionStatus.IN_PROGRESS;
            }
        }
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public Integer getEstimatedHours() {
        return estimatedHours;
    }

    public void setEstimatedHours(Integer estimatedHours) {
        this.estimatedHours = estimatedHours;
    }

    public Integer getActualHours() {
        return actualHours;
    }

    public void setActualHours(Integer actualHours) {
        this.actualHours = actualHours;
    }

    public UUID getMentorId() {
        return mentorId;
    }

    public void setMentorId(UUID mentorId) {
        this.mentorId = mentorId;
    }

    public String getMentorName() {
        return mentorName;
    }

    public void setMentorName(String mentorName) {
        this.mentorName = mentorName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getCompletionNotes() {
        return completionNotes;
    }

    public void setCompletionNotes(String completionNotes) {
        this.completionNotes = completionNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
