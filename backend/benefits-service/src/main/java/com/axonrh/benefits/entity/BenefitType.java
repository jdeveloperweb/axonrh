package com.axonrh.benefits.entity;

import com.axonrh.benefits.enums.BenefitCategory;
import com.axonrh.benefits.enums.CalculationType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "benefit_types", schema = "shared",
        indexes = {
                @Index(name = "idx_benefit_types_tenant", columnList = "tenant_id"),
                @Index(name = "idx_benefit_types_active", columnList = "tenant_id, is_active"),
                @Index(name = "idx_benefit_types_category", columnList = "tenant_id, category")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_benefit_types_name_tenant",
                        columnNames = {"tenant_id", "name"})
        })
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenefitType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private BenefitCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "calculation_type", nullable = false, length = 30)
    private CalculationType calculationType;

    @Column(name = "default_value", precision = 12, scale = 2)
    private BigDecimal defaultValue;

    @Column(name = "default_percentage", precision = 6, scale = 2)
    private BigDecimal defaultPercentage;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

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

    // Integração com Folha de Pagamento
    @Column(name = "payroll_code", length = 50)
    private String payrollCode;

    @Column(name = "payroll_nature", length = 20)
    private String payrollNature; // EARNING, DEDUCTION

    @Column(name = "incidence_inss")
    private Boolean incidenceInss;

    @Column(name = "incidence_fgts")
    private Boolean incidenceFgts;

    @Column(name = "incidence_irrf")
    private Boolean incidenceIrrf;

    // Integração Externa
    @Column(name = "external_provider", length = 50)
    private String externalProvider; // iFood, Flash, etc.

    @Column(name = "integration_config", columnDefinition = "text")
    private String integrationConfig; // JSON string with specific configs

    @Column(name = "rules", columnDefinition = "text")
    private String rules; // JSON string mapping to BenefitRule DTO

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }
}
