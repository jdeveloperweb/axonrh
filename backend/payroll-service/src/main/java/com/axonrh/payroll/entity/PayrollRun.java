package com.axonrh.payroll.entity;

import com.axonrh.payroll.enums.PayrollRunStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "payroll_runs", schema = "shared")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollRun {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "reference_month", nullable = false)
    private Integer referenceMonth;

    @Column(name = "reference_year", nullable = false)
    private Integer referenceYear;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private PayrollRunStatus status = PayrollRunStatus.OPEN;

    @Column(name = "total_employees")
    @Builder.Default
    private Integer totalEmployees = 0;

    @Column(name = "processed_employees")
    @Builder.Default
    private Integer processedEmployees = 0;

    @Column(name = "failed_employees")
    @Builder.Default
    private Integer failedEmployees = 0;

    @Column(name = "total_earnings", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalEarnings = BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "total_net_salary", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalNetSalary = BigDecimal.ZERO;

    @Column(name = "total_fgts", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalFgts = BigDecimal.ZERO;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by")
    private UUID closedBy;

    @OneToMany(mappedBy = "payrollRun", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Payroll> payrolls = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private UUID createdBy;

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

    public void recalculateSummary() {
        this.totalEmployees = payrolls.size();
        this.processedEmployees = (int) payrolls.stream()
                .filter(p -> p.getStatus() != com.axonrh.payroll.enums.PayrollStatus.CANCELLED)
                .count();
        this.totalEarnings = payrolls.stream()
                .map(Payroll::getTotalEarnings)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.totalDeductions = payrolls.stream()
                .map(Payroll::getTotalDeductions)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.totalNetSalary = payrolls.stream()
                .map(Payroll::getNetSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.totalFgts = payrolls.stream()
                .map(Payroll::getFgtsAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
