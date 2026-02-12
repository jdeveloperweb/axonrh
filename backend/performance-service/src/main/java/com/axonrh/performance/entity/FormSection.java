package com.axonrh.performance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "form_sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormSection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    private EvaluationForm form;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "section_order", nullable = false)
    private Integer sectionOrder;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight = BigDecimal.ZERO;

    @Column(name = "section_type", nullable = false, length = 20)
    private String sectionType; // COMPETENCIES, GOALS, BEHAVIORS, OPEN_QUESTIONS

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("questionOrder ASC")
    private List<FormQuestion> questions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
