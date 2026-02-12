package com.axonrh.payroll.entity;

import com.axonrh.payroll.enums.PayrollStatus;
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
@Table(name = "payrolls", schema = "shared")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", nullable = false)
    private String employeeName;

    @Column(name = "employee_cpf")
    private String employeeCpf;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "department_name")
    private String departmentName;

    @Column(name = "position_name")
    private String positionName;

    @Column(name = "reference_month", nullable = false)
    private Integer referenceMonth;

    @Column(name = "reference_year", nullable = false)
    private Integer referenceYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private PayrollStatus status = PayrollStatus.DRAFT;

    @Column(name = "base_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseSalary;

    @Column(name = "total_earnings", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalEarnings = BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "net_salary", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal netSalary = BigDecimal.ZERO;

    @Column(name = "fgts_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal fgtsAmount = BigDecimal.ZERO;

    @Column(name = "calculation_version")
    @Builder.Default
    private Integer calculationVersion = 1;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_run_id")
    private PayrollRun payrollRun;

    @OneToMany(mappedBy = "payroll", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PayrollItem> items = new ArrayList<>();

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

    public void addItem(PayrollItem item) {
        items.add(item);
        item.setPayroll(this);
    }

    public void clearItems() {
        items.clear();
    }

    public void recalculateTotals() {
        this.totalEarnings = items.stream()
                .filter(i -> i.getType() == com.axonrh.payroll.enums.PayrollItemType.EARNING)
                .map(PayrollItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.totalDeductions = items.stream()
                .filter(i -> i.getType() == com.axonrh.payroll.enums.PayrollItemType.DEDUCTION)
                .map(PayrollItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.netSalary = this.totalEarnings.subtract(this.totalDeductions);
    }
}
