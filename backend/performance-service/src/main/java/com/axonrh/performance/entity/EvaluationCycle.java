package com.axonrh.performance.entity;

import com.axonrh.performance.entity.enums.CycleStatus;
import com.axonrh.performance.entity.enums.CycleType;
import com.axonrh.performance.entity.enums.EvaluationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * T173 - Ciclo de Avaliacao de Desempenho.
 */
@Entity
@Table(name = "evaluation_cycles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "cycle_type", nullable = false, length = 20)
    private CycleType cycleType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    // Fases
    @Column(name = "self_evaluation_start")
    private LocalDate selfEvaluationStart;

    @Column(name = "self_evaluation_end")
    private LocalDate selfEvaluationEnd;

    @Column(name = "manager_evaluation_start")
    private LocalDate managerEvaluationStart;

    @Column(name = "manager_evaluation_end")
    private LocalDate managerEvaluationEnd;

    @Column(name = "calibration_start")
    private LocalDate calibrationStart;

    @Column(name = "calibration_end")
    private LocalDate calibrationEnd;

    @Column(name = "feedback_start")
    private LocalDate feedbackStart;

    @Column(name = "feedback_end")
    private LocalDate feedbackEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "evaluation_type", nullable = false, length = 20)
    private EvaluationType evaluationType;

    @Column(name = "include_self_evaluation")
    @Builder.Default
    private Boolean includeSelfEvaluation = true;

    @Column(name = "include_manager_evaluation")
    @Builder.Default
    private Boolean includeManagerEvaluation = true;

    @Column(name = "include_peer_evaluation")
    @Builder.Default
    private Boolean includePeerEvaluation = false;

    @Column(name = "include_subordinate_evaluation")
    @Builder.Default
    private Boolean includeSubordinateEvaluation = false;

    @Column(name = "min_peer_evaluators")
    @Builder.Default
    private Integer minPeerEvaluators = 3;

    @Column(name = "anonymous_peer_evaluation")
    @Builder.Default
    private Boolean anonymousPeerEvaluation = true;

    @Column(name = "require_calibration")
    @Builder.Default
    private Boolean requireCalibration = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CycleStatus status = CycleStatus.DRAFT;

    @Column(name = "default_form_id")
    private UUID defaultFormId;

    @Column(name = "scope", length = 20)
    @Builder.Default
    private String scope = "ALL";

    @Column(name = "department_ids", length = 2000)
    private String departmentIds;

    @Column(name = "employee_ids", length = 2000)
    private String employeeIds;

    @Column(name = "total_evaluations")
    @Builder.Default
    private Integer totalEvaluations = 0;

    @Column(name = "completed_evaluations")
    @Builder.Default
    private Integer completedEvaluations = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    public double getCompletionPercentage() {
        if (totalEvaluations == null || totalEvaluations == 0) return 0;
        return (completedEvaluations * 100.0) / totalEvaluations;
    }

    public boolean isActive() {
        return status == CycleStatus.ACTIVE
                || status == CycleStatus.SELF_EVAL
                || status == CycleStatus.MANAGER_EVAL
                || status == CycleStatus.CALIBRATION
                || status == CycleStatus.FEEDBACK;
    }

    public void activate() {
        if (this.status != CycleStatus.DRAFT) {
            throw new IllegalStateException("Apenas ciclos em rascunho podem ser ativados");
        }
        this.status = CycleStatus.ACTIVE;
    }

    public void complete() {
        if (this.status == CycleStatus.COMPLETED) {
            throw new IllegalStateException("Ciclo ja foi concluido");
        }
        this.status = CycleStatus.COMPLETED;
    }
}
