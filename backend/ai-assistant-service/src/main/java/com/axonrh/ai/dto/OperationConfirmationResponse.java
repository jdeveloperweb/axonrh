package com.axonrh.ai.dto;

import com.axonrh.ai.entity.PendingOperation.OperationStatus;
import com.axonrh.ai.entity.PendingOperation.OperationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for operation confirmation/rejection results.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationConfirmationResponse {

    private UUID operationId;
    private OperationType operationType;
    private OperationStatus status;

    private boolean success;
    private String message;

    private String targetEntity;
    private String targetEntityName;
    private UUID targetId;

    private Integer affectedRecordsCount;

    private Instant executedAt;
    private String executionDetails;

    private boolean canRollback;
    private Instant rollbackDeadline;

    /**
     * Create a success response.
     */
    public static OperationConfirmationResponse success(
            UUID operationId,
            OperationType operationType,
            String targetEntity,
            String targetEntityName,
            UUID targetId,
            int affectedRecords,
            String message) {

        return OperationConfirmationResponse.builder()
                .operationId(operationId)
                .operationType(operationType)
                .status(OperationStatus.EXECUTED)
                .success(true)
                .message(message)
                .targetEntity(targetEntity)
                .targetEntityName(targetEntityName)
                .targetId(targetId)
                .affectedRecordsCount(affectedRecords)
                .executedAt(Instant.now())
                .canRollback(true)
                .rollbackDeadline(Instant.now().plusSeconds(3600)) // 1 hour rollback window
                .build();
    }

    /**
     * Create a rejection response.
     */
    public static OperationConfirmationResponse rejected(UUID operationId, String reason) {
        return OperationConfirmationResponse.builder()
                .operationId(operationId)
                .status(OperationStatus.REJECTED)
                .success(true)
                .message("Operação rejeitada: " + reason)
                .canRollback(false)
                .build();
    }

    /**
     * Create a failure response.
     */
    public static OperationConfirmationResponse failure(UUID operationId, String error) {
        return OperationConfirmationResponse.builder()
                .operationId(operationId)
                .status(OperationStatus.FAILED)
                .success(false)
                .message("Falha na execução: " + error)
                .canRollback(false)
                .build();
    }

    /**
     * Create an expired response.
     */
    public static OperationConfirmationResponse expired(UUID operationId) {
        return OperationConfirmationResponse.builder()
                .operationId(operationId)
                .status(OperationStatus.EXPIRED)
                .success(false)
                .message("Operação expirada. Por favor, solicite a alteração novamente.")
                .canRollback(false)
                .build();
    }
}
