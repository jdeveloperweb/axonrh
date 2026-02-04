package com.axonrh.ai.dto;

import com.axonrh.ai.entity.PendingOperation;
import com.axonrh.ai.entity.PendingOperation.OperationStatus;
import com.axonrh.ai.entity.PendingOperation.OperationType;
import com.axonrh.ai.entity.PendingOperation.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO for data modification operations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataModificationResponse {

    private UUID operationId;
    private OperationType operationType;
    private OperationStatus status;
    private RiskLevel riskLevel;

    private String targetTable;
    private String targetEntity;
    private String targetEntityName;
    private UUID targetId;

    private String description;
    private String confirmationMessage;

    private List<ChangePreview> changes;
    private Integer affectedRecordsCount;

    private Instant expiresAt;
    private Instant createdAt;

    private boolean requiresConfirmation;
    private String warningMessage;

    private Map<String, Object> metadata;

    /**
     * Preview of a single field change.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePreview {
        private String fieldName;
        private String fieldLabel;
        private String oldValue;
        private String newValue;
        private String changeType;
        private boolean isSensitive;
    }

    /**
     * Create a response from a PendingOperation entity.
     */
    public static DataModificationResponse fromEntity(PendingOperation operation) {
        DataModificationResponseBuilder builder = DataModificationResponse.builder()
                .operationId(operation.getId())
                .operationType(operation.getOperationType())
                .status(operation.getStatus())
                .riskLevel(operation.getRiskLevel())
                .targetTable(operation.getTargetTable())
                .targetEntity(operation.getTargetEntity())
                .targetId(operation.getTargetId())
                .description(operation.getDescription())
                .affectedRecordsCount(operation.getAffectedRecordsCount())
                .expiresAt(operation.getExpiresAt())
                .createdAt(operation.getCreatedAt())
                .requiresConfirmation(operation.getRequiresApproval())
                .metadata(operation.getMetadata());

        if (operation.getChangesSummary() != null) {
            List<ChangePreview> changes = operation.getChangesSummary().stream()
                    .map(dc -> ChangePreview.builder()
                            .fieldName(dc.getField())
                            .fieldLabel(dc.getFieldLabel())
                            .oldValue(dc.getOldValue() != null ? dc.getOldValue().toString() : null)
                            .newValue(dc.getNewValue() != null ? dc.getNewValue().toString() : null)
                            .changeType(dc.getChangeType())
                            .build())
                    .toList();
            builder.changes(changes);
        }

        return builder.build();
    }
}
