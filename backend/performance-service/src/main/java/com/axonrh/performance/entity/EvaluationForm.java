package com.axonrh.performance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "evaluation_forms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationForm {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 1000)
    private String description;

    private Integer version = 1;

    @Column(name = "form_type", nullable = false, length = 20)
    private String formType; // PERFORMANCE, COMPETENCY, GOALS, MIXED

    @Column(name = "total_weight", precision = 5, scale = 2)
    private BigDecimal totalWeight = new BigDecimal("100.00");

    @Column(name = "passing_score", precision = 5, scale = 2)
    private BigDecimal passingScore = new BigDecimal("70.00");

    @Column(name = "scale_type", length = 20)
    private String scaleType = "NUMERIC";

    @Column(name = "scale_min")
    private Integer scaleMin = 1;

    @Column(name = "scale_max")
    private Integer scaleMax = 5;

    private Boolean active = true;

    @Column(name = "is_template")
    private Boolean isTemplate = false;

    @OneToMany(mappedBy = "form", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sectionOrder ASC")
    private List<FormSection> sections = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;
}
