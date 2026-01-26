package com.axonrh.timesheet.entity;

import com.axonrh.timesheet.entity.enums.AdjustmentStatus;
import com.axonrh.timesheet.entity.enums.RecordType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * T129 - Solicitacao de ajuste de ponto.
 * Registra pedidos de correcao ou inclusao de marcacoes.
 */
@Entity
@Table(name = "time_adjustments", indexes = {
    @Index(name = "idx_time_adjustments_employee", columnList = "employee_id"),
    @Index(name = "idx_time_adjustments_tenant_status", columnList = "tenant_id, status"),
    @Index(name = "idx_time_adjustments_approver", columnList = "approver_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 200)
    private String employeeName;

    // Tipo de ajuste
    @Column(name = "adjustment_type", nullable = false, length = 30)
    private String adjustmentType; // ADD, MODIFY, DELETE

    // Registro original (se modificando ou excluindo)
    @Column(name = "original_record_id")
    private UUID originalRecordId;

    // Data e horario do ajuste
    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "record_type", nullable = false, length = 20)
    private RecordType recordType;

    // Horario original (se modificando)
    @Column(name = "original_time")
    private LocalTime originalTime;

    // Novo horario solicitado
    @Column(name = "requested_time", nullable = false)
    private LocalTime requestedTime;

    // Justificativa do colaborador
    @Column(name = "justification", nullable = false, length = 1000)
    private String justification;

    // Anexos (comprovantes)
    @Column(name = "attachment_urls", length = 2000)
    private String attachmentUrls; // JSON array

    // Status do ajuste
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AdjustmentStatus status = AdjustmentStatus.PENDING;

    // Aprovador
    @Column(name = "approver_id")
    private UUID approverId;

    @Column(name = "approver_name", length = 200)
    private String approverName;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approval_notes", length = 500)
    private String approvalNotes;

    // Registro criado apos aprovacao
    @Column(name = "created_record_id")
    private UUID createdRecordId;

    // Auditoria
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
