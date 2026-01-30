package com.axonrh.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_intents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiIntent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    private String description;

    @Column(length = 50)
    private String category;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "training_phrases", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> trainingPhrases = List.of();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> entities = List.of();

    @Column(name = "response_template", columnDefinition = "TEXT")
    private String responseTemplate;

    @Column(name = "action_type", length = 50)
    @Enumerated(EnumType.STRING)
    private ActionType actionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "action_config", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> actionConfig = Map.of();

    @Column(name = "confidence_threshold", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal confidenceThreshold = new BigDecimal("0.70");

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum ActionType {
        DATABASE_QUERY,
        CALCULATION,
        KNOWLEDGE_SEARCH,
        API_CALL,
        WORKFLOW_TRIGGER,
        INFORMATION,
        ACTION_CONFIRMATION
    }
}
