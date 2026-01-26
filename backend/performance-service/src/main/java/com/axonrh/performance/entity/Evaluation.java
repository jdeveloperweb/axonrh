package com.axonrh.performance.entity;

import com.axonrh.performance.entity.enums.EvaluationStatus;
import com.axonrh.performance.entity.enums.EvaluationType;
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
 * Avaliacao de desempenho.
 */
@Entity
@Table(name = "evaluations")
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id", nullable = false)
    private EvaluationCycle cycle;

    @Column(name = "form_id", nullable = false)
    private UUID formId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "evaluator_id", nullable = false)
    private UUID evaluatorId;

    @Column(name = "evaluator_name")
    private String evaluatorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "evaluation_type", nullable = false)
    private EvaluationType evaluationType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvaluationStatus status = EvaluationStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "calibrated_at")
    private LocalDateTime calibratedAt;

    @Column(name = "final_score", precision = 5, scale = 2)
    private BigDecimal finalScore;

    @Column(name = "calibrated_score", precision = 5, scale = 2)
    private BigDecimal calibratedScore;

    @Column(name = "performance_score", precision = 5, scale = 2)
    private BigDecimal performanceScore;

    @Column(name = "potential_score", precision = 5, scale = 2)
    private BigDecimal potentialScore;

    @Column(name = "calibration_notes", columnDefinition = "TEXT")
    private String calibrationNotes;

    @Column(name = "overall_feedback", columnDefinition = "TEXT")
    private String overallFeedback;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(name = "areas_for_improvement", columnDefinition = "TEXT")
    private String areasForImprovement;

    @Column(name = "goals_for_next_period", columnDefinition = "TEXT")
    private String goalsForNextPeriod;

    @Column(name = "is_acknowledged")
    private Boolean isAcknowledged = false;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "employee_comments", columnDefinition = "TEXT")
    private String employeeComments;

    @OneToMany(mappedBy = "evaluation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvaluationAnswer> answers = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Business methods
    public void start() {
        if (this.status != EvaluationStatus.PENDING) {
            throw new IllegalStateException("Avaliacao ja foi iniciada");
        }
        this.status = EvaluationStatus.IN_PROGRESS;
        this.startedAt = LocalDateTime.now();
    }

    public void submit() {
        if (this.status != EvaluationStatus.IN_PROGRESS) {
            throw new IllegalStateException("Avaliacao nao pode ser submetida");
        }
        calculateScores();
        this.status = EvaluationStatus.SUBMITTED;
        this.submittedAt = LocalDateTime.now();
    }

    public void calibrate(BigDecimal newScore, String notes) {
        if (this.status != EvaluationStatus.SUBMITTED) {
            throw new IllegalStateException("Avaliacao nao pode ser calibrada");
        }
        this.calibratedScore = newScore;
        this.calibrationNotes = notes;
        this.status = EvaluationStatus.CALIBRATED;
        this.calibratedAt = LocalDateTime.now();
    }

    public void complete() {
        if (this.status != EvaluationStatus.CALIBRATED && this.status != EvaluationStatus.SUBMITTED) {
            throw new IllegalStateException("Avaliacao nao pode ser concluida");
        }
        this.status = EvaluationStatus.COMPLETED;
        if (this.calibratedScore != null) {
            this.finalScore = this.calibratedScore;
        }
    }

    public void acknowledge(String comments) {
        this.isAcknowledged = true;
        this.acknowledgedAt = LocalDateTime.now();
        this.employeeComments = comments;
    }

    private void calculateScores() {
        if (answers.isEmpty()) {
            return;
        }

        // Calcula media ponderada das respostas
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal weightedSum = BigDecimal.ZERO;

        for (EvaluationAnswer answer : answers) {
            if (answer.getScore() != null && answer.getWeight() != null) {
                weightedSum = weightedSum.add(
                        answer.getScore().multiply(answer.getWeight())
                );
                totalWeight = totalWeight.add(answer.getWeight());
            }
        }

        if (totalWeight.compareTo(BigDecimal.ZERO) > 0) {
            this.finalScore = weightedSum.divide(totalWeight, 2, java.math.RoundingMode.HALF_UP);
        }
    }

    public boolean isOverdue() {
        return dueDate != null
                && LocalDate.now().isAfter(dueDate)
                && status != EvaluationStatus.COMPLETED;
    }

    public int getDaysUntilDue() {
        if (dueDate == null) return Integer.MAX_VALUE;
        return (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
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

    public EvaluationCycle getCycle() {
        return cycle;
    }

    public void setCycle(EvaluationCycle cycle) {
        this.cycle = cycle;
    }

    public UUID getFormId() {
        return formId;
    }

    public void setFormId(UUID formId) {
        this.formId = formId;
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

    public UUID getEvaluatorId() {
        return evaluatorId;
    }

    public void setEvaluatorId(UUID evaluatorId) {
        this.evaluatorId = evaluatorId;
    }

    public String getEvaluatorName() {
        return evaluatorName;
    }

    public void setEvaluatorName(String evaluatorName) {
        this.evaluatorName = evaluatorName;
    }

    public EvaluationType getEvaluationType() {
        return evaluationType;
    }

    public void setEvaluationType(EvaluationType evaluationType) {
        this.evaluationType = evaluationType;
    }

    public EvaluationStatus getStatus() {
        return status;
    }

    public void setStatus(EvaluationStatus status) {
        this.status = status;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getCalibratedAt() {
        return calibratedAt;
    }

    public void setCalibratedAt(LocalDateTime calibratedAt) {
        this.calibratedAt = calibratedAt;
    }

    public BigDecimal getFinalScore() {
        return finalScore;
    }

    public void setFinalScore(BigDecimal finalScore) {
        this.finalScore = finalScore;
    }

    public BigDecimal getCalibratedScore() {
        return calibratedScore;
    }

    public void setCalibratedScore(BigDecimal calibratedScore) {
        this.calibratedScore = calibratedScore;
    }

    public BigDecimal getPerformanceScore() {
        return performanceScore;
    }

    public void setPerformanceScore(BigDecimal performanceScore) {
        this.performanceScore = performanceScore;
    }

    public BigDecimal getPotentialScore() {
        return potentialScore;
    }

    public void setPotentialScore(BigDecimal potentialScore) {
        this.potentialScore = potentialScore;
    }

    public String getCalibrationNotes() {
        return calibrationNotes;
    }

    public void setCalibrationNotes(String calibrationNotes) {
        this.calibrationNotes = calibrationNotes;
    }

    public String getOverallFeedback() {
        return overallFeedback;
    }

    public void setOverallFeedback(String overallFeedback) {
        this.overallFeedback = overallFeedback;
    }

    public String getStrengths() {
        return strengths;
    }

    public void setStrengths(String strengths) {
        this.strengths = strengths;
    }

    public String getAreasForImprovement() {
        return areasForImprovement;
    }

    public void setAreasForImprovement(String areasForImprovement) {
        this.areasForImprovement = areasForImprovement;
    }

    public String getGoalsForNextPeriod() {
        return goalsForNextPeriod;
    }

    public void setGoalsForNextPeriod(String goalsForNextPeriod) {
        this.goalsForNextPeriod = goalsForNextPeriod;
    }

    public Boolean getIsAcknowledged() {
        return isAcknowledged;
    }

    public void setIsAcknowledged(Boolean isAcknowledged) {
        this.isAcknowledged = isAcknowledged;
    }

    public LocalDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public String getEmployeeComments() {
        return employeeComments;
    }

    public void setEmployeeComments(String employeeComments) {
        this.employeeComments = employeeComments;
    }

    public List<EvaluationAnswer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<EvaluationAnswer> answers) {
        this.answers = answers;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
