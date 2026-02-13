package com.axonrh.benefits.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "benefit_history", schema = "shared",
        indexes = {
                @Index(name = "idx_benefit_history_tenant", columnList = "tenant_id"),
                @Index(name = "idx_benefit_history_employee", columnList = "tenant_id, employee_id"),
                @Index(name = "idx_benefit_history_benefit", columnList = "employee_benefit_id"),
                @Index(name = "idx_benefit_history_date", columnList = "tenant_id, changed_at")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenefitHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_benefit_id", nullable = false)
    private UUID employeeBenefitId;

    @Column(name = "benefit_type_name", nullable = false, length = 150)
    private String benefitTypeName;

    @Column(name = "action", nullable = false, length = 30)
    private String action;

    @Column(name = "old_value", precision = 12, scale = 2)
    private BigDecimal oldValue;

    @Column(name = "new_value", precision = 12, scale = 2)
    private BigDecimal newValue;

    @Column(name = "old_percentage", precision = 6, scale = 2)
    private BigDecimal oldPercentage;

    @Column(name = "new_percentage", precision = 6, scale = 2)
    private BigDecimal newPercentage;

    @Column(name = "old_status", length = 20)
    private String oldStatus;

    @Column(name = "new_status", length = 20)
    private String newStatus;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(name = "changed_at", updatable = false)
    private LocalDateTime changedAt;

    @Column(name = "changed_by")
    private UUID changedBy;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }
}
