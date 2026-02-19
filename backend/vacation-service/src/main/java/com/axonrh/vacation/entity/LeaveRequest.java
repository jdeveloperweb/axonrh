package com.axonrh.vacation.entity;

import com.axonrh.vacation.entity.enums.LeaveType;
import com.axonrh.vacation.entity.enums.VacationRequestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade para tratar todos os tipos de licenças e afastamentos.
 */
@Entity
@Table(name = "leave_requests", indexes = {
    @Index(name = "idx_leave_requests_tenant", columnList = "tenant_id"),
    @Index(name = "idx_leave_requests_employee", columnList = "employee_id"),
    @Index(name = "idx_leave_requests_status", columnList = "tenant_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 200)
    private String employeeName;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private LeaveType type;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "days_count", nullable = false)
    private Integer daysCount;

    // Campos específicos para licença médica
    @Column(name = "certificate_url", length = 500)
    private String certificateUrl;

    @Column(name = "cid", length = 20)
    private String cid;

    @Column(name = "cid_description", length = 500)
    private String cidDescription;

    @Column(name = "doctor_name", length = 200)
    private String doctorName;

    @Column(name = "crm", length = 50)
    private String crm;

    // Workflow e Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private VacationRequestStatus status = VacationRequestStatus.PENDING;

    @Column(name = "reason", length = 1000)
    private String reason;

    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;

    // Auditoria
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
}
