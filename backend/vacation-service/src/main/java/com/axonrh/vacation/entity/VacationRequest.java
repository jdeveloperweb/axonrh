package com.axonrh.vacation.entity;

import com.axonrh.vacation.entity.enums.VacationRequestStatus;
import com.axonrh.vacation.entity.enums.VacationRequestType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * T156 - Solicitacao de Ferias.
 */
@Entity
@Table(name = "vacation_requests", indexes = {
    @Index(name = "idx_vacation_requests_tenant", columnList = "tenant_id"),
    @Index(name = "idx_vacation_requests_employee", columnList = "employee_id"),
    @Index(name = "idx_vacation_requests_status", columnList = "tenant_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VacationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 200)
    private String employeeName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacation_period_id", nullable = false)
    private VacationPeriod vacationPeriod;

    // Periodo solicitado
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "days_count", nullable = false)
    private Integer daysCount;

    // Tipo
    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 20)
    @Builder.Default
    private VacationRequestType requestType = VacationRequestType.REGULAR;

    @Column(name = "fraction_number")
    private Integer fractionNumber; // 1, 2 ou 3 para ferias fracionadas

    // Abono pecuniario
    @Column(name = "sell_days")
    @Builder.Default
    private Boolean sellDays = false;

    @Column(name = "sold_days_count")
    @Builder.Default
    private Integer soldDaysCount = 0;

    // Adiantamento 13o
    @Column(name = "advance_13th_salary")
    @Builder.Default
    private Boolean advance13thSalary = false;

    // Workflow
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private VacationRequestStatus status = VacationRequestStatus.PENDING;

    // Aprovacao
    @Column(name = "approver_id")
    private UUID approverId;

    @Column(name = "approver_name", length = 200)
    private String approverName;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approval_notes", length = 1000)
    private String approvalNotes;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    // Pagamento
    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "payment_value", precision = 15, scale = 2)
    private BigDecimal paymentValue;

    @Column(name = "payment_13th_value", precision = 15, scale = 2)
    private BigDecimal payment13thValue;

    // Documentos
    @Column(name = "notice_document_url", length = 500)
    private String noticeDocumentUrl;

    @Column(name = "receipt_document_url", length = 500)
    private String receiptDocumentUrl;

    // Observacoes
    @Column(name = "notes", length = 1000)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    /**
     * Verifica se pode ser cancelada.
     */
    public boolean canCancel() {
        return status == VacationRequestStatus.PENDING || 
               status == VacationRequestStatus.MANAGER_APPROVED || 
               status == VacationRequestStatus.APPROVED;
    }

    /**
     * Verifica se ja iniciou.
     */
    public boolean hasStarted() {
        return LocalDate.now().isAfter(startDate) || LocalDate.now().isEqual(startDate);
    }

    /**
     * Verifica se ja terminou.
     */
    public boolean hasEnded() {
        return LocalDate.now().isAfter(endDate);
    }
}
