package com.axonrh.benefits.entity;

import com.axonrh.benefits.enums.EmployeeBenefitStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "employee_benefits", schema = "shared",
        indexes = {
                @Index(name = "idx_employee_benefits_tenant", columnList = "tenant_id"),
                @Index(name = "idx_employee_benefits_employee", columnList = "tenant_id, employee_id"),
                @Index(name = "idx_employee_benefits_status", columnList = "tenant_id, status"),
                @Index(name = "idx_employee_benefits_type", columnList = "benefit_type_id"),
                @Index(name = "idx_employee_benefits_period", columnList = "tenant_id, employee_id, start_date, end_date")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeBenefit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", nullable = false, length = 200)
    private String employeeName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "benefit_type_id", nullable = false)
    private BenefitType benefitType;

    @Column(name = "fixed_value", precision = 12, scale = 2)
    private BigDecimal fixedValue;

    @Column(name = "percentage", precision = 6, scale = 2)
    private BigDecimal percentage;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EmployeeBenefitStatus status = EmployeeBenefitStatus.ACTIVE;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private UUID createdBy;

    @OneToMany(mappedBy = "employeeBenefit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<EmployeeBenefitDependent> dependents = new java.util.ArrayList<>();

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @LastModifiedBy
    @Column(name = "updated_by")
    private UUID updatedBy;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }

    public boolean isActiveInPeriod(LocalDate referenceDate) {
        if (status != EmployeeBenefitStatus.ACTIVE) {
            return false;
        }
        boolean afterStart = !referenceDate.isBefore(startDate);
        boolean beforeEnd = endDate == null || !referenceDate.isAfter(endDate);
        return afterStart && beforeEnd;
    }
}
