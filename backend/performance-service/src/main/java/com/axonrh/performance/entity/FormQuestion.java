package com.axonrh.performance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "form_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private FormSection section;

    @Column(name = "question_text", nullable = false, length = 1000)
    private String questionText;

    @Column(name = "question_type", nullable = false, length = 20)
    private String questionType; // RATING, TEXT, MULTIPLE_CHOICE, YES_NO

    @Column(name = "question_order", nullable = false)
    private Integer questionOrder;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight = BigDecimal.ZERO;

    private Boolean required = true;

    @Column(name = "competency_id")
    private UUID competencyId;

    @Column(name = "goal_id")
    private UUID goalId;

    @Column(columnDefinition = "TEXT")
    private String options; // JSON array for multiple choice

    @Column(name = "help_text", length = 500)
    private String helpText;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
