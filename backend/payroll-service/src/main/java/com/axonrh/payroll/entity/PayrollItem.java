package com.axonrh.payroll.entity;

import com.axonrh.payroll.enums.PayrollItemCode;
import com.axonrh.payroll.enums.PayrollItemType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "payroll_items", schema = "shared")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_id", nullable = false)
    private Payroll payroll;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private PayrollItemType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "code", nullable = false)
    private PayrollItemCode code;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "reference_value", precision = 12, scale = 4)
    private BigDecimal referenceValue;

    @Column(name = "quantity", precision = 8, scale = 2)
    private BigDecimal quantity;

    @Column(name = "percentage", precision = 6, scale = 2)
    private BigDecimal percentage;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }
}
