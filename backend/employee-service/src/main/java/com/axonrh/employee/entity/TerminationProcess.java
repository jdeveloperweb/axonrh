package com.axonrh.employee.entity;

import com.axonrh.employee.entity.enums.TerminationNoticePeriod;
import com.axonrh.employee.entity.enums.TerminationType;
import com.axonrh.employee.entity.enums.TerminationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import java.math.BigDecimal;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que controla o processo de desligamento de um colaborador.
 */
@Entity
@Table(name = "termination_processes", schema = "shared")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TerminationProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "termination_type", nullable = false, length = 30)
    private TerminationType terminationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "notice_period", nullable = false, length = 20)
    private TerminationNoticePeriod noticePeriod;

    @Column(name = "last_work_day", nullable = false)
    private LocalDate lastWorkDay;

    @Column(name = "termination_date", nullable = false)
    private LocalDate terminationDate;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    @Builder.Default
    private TerminationStatus status = TerminationStatus.IN_PROGRESS;

    // ==================== Checklist de Devolução ====================

    @Column(name = "returned_laptop")
    @Builder.Default
    private Boolean returnedLaptop = false;

    @Column(name = "returned_mouse")
    @Builder.Default
    private Boolean returnedMouse = false;

    @Column(name = "returned_keyboard")
    @Builder.Default
    private Boolean returnedKeyboard = false;

    @Column(name = "returned_headset")
    @Builder.Default
    private Boolean returnedHeadset = false;

    @Column(name = "returned_badge")
    @Builder.Default
    private Boolean returnedBadge = false;

    @Column(name = "returned_token")
    @Builder.Default
    private Boolean returnedToken = false;

    @Column(name = "other_equipment", length = 200)
    private String otherEquipment;

    @Column(name = "equipment_notes", columnDefinition = "TEXT")
    private String equipmentNotes;

    // ==================== Checklist de Desligamento ====================

    @Column(name = "account_deactivated")
    @Builder.Default
    private Boolean accountDeactivated = false;

    @Column(name = "email_deactivated")
    @Builder.Default
    private Boolean emailDeactivated = false;

    @Column(name = "exit_interview_done")
    @Builder.Default
    private Boolean exitInterviewDone = false;

    @Column(name = "esocial_sent")
    @Builder.Default
    private Boolean esocialSent = false;

    // ==================== Exames e Atividades ====================

    @Column(name = "dismissal_exam_done")
    @Builder.Default
    private Boolean dismissalExamDone = false;

    @Column(name = "dismissal_exam_date")
    private LocalDate dismissalExamDate;

    // ==================== Financeiro ====================

    @Column(name = "severance_pay_amount", precision = 19, scale = 2)
    private BigDecimal severancePayAmount;

    @Column(name = "severance_pay_date")
    private LocalDate severancePayDate;

    @Column(name = "severance_pay_method", length = 50)
    private String severancePayMethod;

    @Column(name = "financial_notes", columnDefinition = "TEXT")
    private String financialNotes;

    // ==================== Comentários Gerais ====================

    @Column(name = "general_notes", columnDefinition = "TEXT")
    private String generalNotes;

    // ==================== Auditoria ====================

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private UUID createdBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_by")
    private UUID completedBy;
}
