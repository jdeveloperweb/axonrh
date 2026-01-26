package com.axonrh.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_feedback")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "conversation_id", nullable = false, length = 100)
    private String conversationId;

    @Column(name = "message_id", nullable = false, length = 100)
    private String messageId;

    private Integer rating;

    @Column(name = "feedback_type", length = 20)
    @Enumerated(EnumType.STRING)
    private FeedbackType feedbackType;

    @Column(name = "feedback_text", columnDefinition = "TEXT")
    private String feedbackText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> categories = List.of();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> metadata = Map.of();

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    public enum FeedbackType {
        POSITIVE,
        NEGATIVE,
        NEUTRAL
    }
}
