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

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Represents a pending data modification operation that requires user confirmation.
 * This entity stores INSERT, UPDATE, or DELETE operations that were requested
 * through natural language processing and awaits explicit user approval before execution.
 */
@Entity
@Table(name = "pending_operations", indexes = {
    @Index(name = "idx_pending_ops_tenant_user", columnList = "tenant_id, user_id"),
    @Index(name = "idx_pending_ops_status", columnList = "status"),
    @Index(name = "idx_pending_ops_conversation", columnList = "conversation_id"),
    @Index(name = "idx_pending_ops_expires", columnList = "expires_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "conversation_id", length = 100)
    private String conversationId;

    @Column(name = "message_id", length = 100)
    private String messageId;

    @Column(name = "operation_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private OperationType operationType;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OperationStatus status = OperationStatus.PENDING;

    @Column(name = "target_table", nullable = false, length = 100)
    private String targetTable;

    @Column(name = "target_entity", length = 100)
    private String targetEntity;

    @Column(name = "target_id")
    private UUID targetId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "natural_language_request", columnDefinition = "TEXT")
    private String naturalLanguageRequest;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "original_data", columnDefinition = "jsonb")
    private Map<String, Object> originalData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_data", columnDefinition = "jsonb")
    private Map<String, Object> newData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "changes_summary", columnDefinition = "jsonb")
    private List<DataChange> changesSummary;

    @Column(name = "generated_sql", columnDefinition = "TEXT")
    private String generatedSql;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sql_parameters", columnDefinition = "jsonb")
    private Map<String, Object> sqlParameters;

    @Column(name = "affected_records_count")
    @Builder.Default
    private Integer affectedRecordsCount = 1;

    @Column(name = "risk_level", length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RiskLevel riskLevel = RiskLevel.LOW;

    @Column(name = "requires_approval")
    @Builder.Default
    private Boolean requiresApproval = true;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejected_by")
    private UUID rejectedBy;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "executed_at")
    private Instant executedAt;

    @Column(name = "execution_result", columnDefinition = "TEXT")
    private String executionResult;

    @Column(name = "execution_error", columnDefinition = "TEXT")
    private String executionError;

    @Column(name = "rollback_sql", columnDefinition = "TEXT")
    private String rollbackSql;

    @Column(name = "is_rolled_back")
    @Builder.Default
    private Boolean isRolledBack = false;

    @Column(name = "rolled_back_at")
    private Instant rolledBackAt;

    @Column(name = "rolled_back_by")
    private UUID rolledBackBy;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    /**
     * Types of database operations supported.
     */
    public enum OperationType {
        INSERT,
        UPDATE,
        DELETE,
        BULK_UPDATE,
        BULK_DELETE
    }

    /**
     * Status of the pending operation.
     */
    public enum OperationStatus {
        PENDING,
        APPROVED,
        REJECTED,
        EXECUTED,
        FAILED,
        EXPIRED,
        ROLLED_BACK,
        CANCELLED
    }

    /**
     * Risk level of the operation.
     */
    public enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    /**
     * Represents a single data change within an operation.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataChange {
        private String field;
        private String fieldLabel;
        private Object oldValue;
        private Object newValue;
        private String changeType;
    }

    /**
     * Check if the operation is still valid (not expired).
     */
    public boolean isValid() {
        return status == OperationStatus.PENDING &&
               (expiresAt == null || Instant.now().isBefore(expiresAt));
    }

    /**
     * Approve the operation.
     */
    public void approve(UUID approver) {
        this.status = OperationStatus.APPROVED;
        this.approvedBy = approver;
        this.approvedAt = Instant.now();
    }

    /**
     * Reject the operation.
     */
    public void reject(UUID rejecter, String reason) {
        this.status = OperationStatus.REJECTED;
        this.rejectedBy = rejecter;
        this.rejectedAt = Instant.now();
        this.rejectionReason = reason;
    }

    /**
     * Mark operation as executed.
     */
    public void markExecuted(String result) {
        this.status = OperationStatus.EXECUTED;
        this.executedAt = Instant.now();
        this.executionResult = result;
    }

    /**
     * Mark operation as failed.
     */
    public void markFailed(String error) {
        this.status = OperationStatus.FAILED;
        this.executedAt = Instant.now();
        this.executionError = error;
    }

    /**
     * Mark operation as rolled back.
     */
    public void markRolledBack(UUID rollbackBy) {
        this.isRolledBack = true;
        this.rolledBackAt = Instant.now();
        this.rolledBackBy = rollbackBy;
        this.status = OperationStatus.ROLLED_BACK;
    }
}
