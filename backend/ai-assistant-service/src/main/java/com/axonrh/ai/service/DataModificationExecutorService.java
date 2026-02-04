package com.axonrh.ai.service;

import com.axonrh.ai.dto.OperationConfirmationRequest;
import com.axonrh.ai.dto.OperationConfirmationResponse;
import com.axonrh.ai.entity.PendingOperation;
import com.axonrh.ai.entity.PendingOperation.OperationStatus;
import com.axonrh.ai.repository.PendingOperationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service for executing confirmed data modification operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataModificationExecutorService {

    private final PendingOperationRepository operationRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    /**
     * Process a confirmation request (approve or reject).
     */
    @Transactional
    public OperationConfirmationResponse processConfirmation(
            OperationConfirmationRequest request,
            UUID tenantId,
            UUID userId) {

        log.info("Processing confirmation for operation: {}, confirmed: {}",
                request.getOperationId(), request.isConfirmed());

        // Find the operation
        Optional<PendingOperation> optOperation = operationRepository
                .findByIdAndTenantId(request.getOperationId(), tenantId);

        if (optOperation.isEmpty()) {
            return OperationConfirmationResponse.failure(
                    request.getOperationId(),
                    "Operação não encontrada.");
        }

        PendingOperation operation = optOperation.get();

        // Check if operation is still valid
        if (!operation.isValid()) {
            if (operation.getStatus() == OperationStatus.PENDING) {
                operation.setStatus(OperationStatus.EXPIRED);
                operationRepository.save(operation);
            }
            return OperationConfirmationResponse.expired(request.getOperationId());
        }

        // Check if already processed
        if (operation.getStatus() != OperationStatus.PENDING) {
            return OperationConfirmationResponse.builder()
                    .operationId(operation.getId())
                    .status(operation.getStatus())
                    .success(false)
                    .message("Esta operação já foi processada anteriormente.")
                    .build();
        }

        if (request.isConfirmed()) {
            return executeOperation(operation, userId);
        } else {
            return rejectOperation(operation, userId, request.getRejectionReason());
        }
    }

    /**
     * Execute an approved operation.
     */
    private OperationConfirmationResponse executeOperation(PendingOperation operation, UUID userId) {
        operation.approve(userId);

        try {
            // Build parameters
            Map<String, Object> params = new HashMap<>();
            params.put("tenant_id", operation.getTenantId());
            params.put("entity_id", operation.getTargetId());

            if (operation.getSqlParameters() != null) {
                params.putAll(operation.getSqlParameters());
            }

            log.info("Executing SQL: {} with params: {}", operation.getGeneratedSql(), params);

            // Execute the SQL
            int affectedRows = jdbcTemplate.update(operation.getGeneratedSql(), params);

            operation.markExecuted(String.format("Operação executada com sucesso. %d registro(s) afetado(s).", affectedRows));
            operation.setAffectedRecordsCount(affectedRows);
            operationRepository.save(operation);

            log.info("Operation {} executed successfully. Affected rows: {}", operation.getId(), affectedRows);

            @SuppressWarnings("unchecked")
            Map<String, Object> metadata = operation.getMetadata();
            String entityName = metadata != null ? (String) metadata.get("entityName") : null;

            return OperationConfirmationResponse.success(
                    operation.getId(),
                    operation.getOperationType(),
                    operation.getTargetEntity(),
                    entityName,
                    operation.getTargetId(),
                    affectedRows,
                    buildSuccessMessage(operation, entityName));

        } catch (Exception e) {
            log.error("Failed to execute operation {}: {}", operation.getId(), e.getMessage(), e);

            operation.markFailed(e.getMessage());
            operationRepository.save(operation);

            return OperationConfirmationResponse.failure(
                    operation.getId(),
                    "Erro ao executar a operação: " + e.getMessage());
        }
    }

    /**
     * Reject an operation.
     */
    private OperationConfirmationResponse rejectOperation(
            PendingOperation operation, UUID userId, String reason) {

        operation.reject(userId, reason != null ? reason : "Rejeitado pelo usuário");
        operationRepository.save(operation);

        log.info("Operation {} rejected by user {}", operation.getId(), userId);

        return OperationConfirmationResponse.rejected(
                operation.getId(),
                reason != null ? reason : "Operação cancelada pelo usuário.");
    }

    /**
     * Build a success message based on operation type.
     */
    private String buildSuccessMessage(PendingOperation operation, String entityName) {
        String name = entityName != null ? entityName : "Registro";

        return switch (operation.getOperationType()) {
            case INSERT -> String.format("%s criado com sucesso!", operation.getTargetEntity());
            case UPDATE -> String.format("Dados de %s atualizados com sucesso!", name);
            case DELETE -> String.format("%s removido com sucesso!", name);
            case BULK_UPDATE -> String.format("%d registros atualizados com sucesso!", operation.getAffectedRecordsCount());
            case BULK_DELETE -> String.format("%d registros removidos com sucesso!", operation.getAffectedRecordsCount());
        };
    }

    /**
     * Rollback an executed operation.
     */
    @Transactional
    public OperationConfirmationResponse rollbackOperation(UUID operationId, UUID tenantId, UUID userId) {
        log.info("Attempting rollback for operation: {}", operationId);

        Optional<PendingOperation> optOperation = operationRepository.findByIdAndTenantId(operationId, tenantId);

        if (optOperation.isEmpty()) {
            return OperationConfirmationResponse.failure(operationId, "Operação não encontrada.");
        }

        PendingOperation operation = optOperation.get();

        if (operation.getStatus() != OperationStatus.EXECUTED) {
            return OperationConfirmationResponse.failure(operationId,
                    "Apenas operações executadas podem ser revertidas.");
        }

        if (operation.getRollbackSql() == null || operation.getRollbackSql().isEmpty()) {
            return OperationConfirmationResponse.failure(operationId,
                    "Esta operação não pode ser revertida.");
        }

        if (operation.getIsRolledBack()) {
            return OperationConfirmationResponse.failure(operationId,
                    "Esta operação já foi revertida anteriormente.");
        }

        // Check rollback window (1 hour)
        if (operation.getExecutedAt() != null &&
            Instant.now().isAfter(operation.getExecutedAt().plusSeconds(3600))) {
            return OperationConfirmationResponse.failure(operationId,
                    "O período para reversão expirou (máximo 1 hora após execução).");
        }

        try {
            log.info("Executing rollback SQL: {}", operation.getRollbackSql());

            int affectedRows = jdbcTemplate.update(operation.getRollbackSql(),
                    Map.of("tenant_id", operation.getTenantId()));

            operation.markRolledBack(userId);
            operationRepository.save(operation);

            log.info("Rollback successful for operation {}. Affected rows: {}", operationId, affectedRows);

            @SuppressWarnings("unchecked")
            Map<String, Object> metadata = operation.getMetadata();
            String entityName = metadata != null ? (String) metadata.get("entityName") : null;

            return OperationConfirmationResponse.builder()
                    .operationId(operationId)
                    .operationType(operation.getOperationType())
                    .status(OperationStatus.ROLLED_BACK)
                    .success(true)
                    .message(String.format("Alterações em %s revertidas com sucesso!", entityName))
                    .targetEntity(operation.getTargetEntity())
                    .targetEntityName(entityName)
                    .targetId(operation.getTargetId())
                    .affectedRecordsCount(affectedRows)
                    .canRollback(false)
                    .build();

        } catch (Exception e) {
            log.error("Rollback failed for operation {}: {}", operationId, e.getMessage(), e);

            return OperationConfirmationResponse.failure(operationId,
                    "Erro ao reverter a operação: " + e.getMessage());
        }
    }

    /**
     * Get operation by ID.
     */
    public Optional<PendingOperation> getOperation(UUID operationId, UUID tenantId) {
        return operationRepository.findByIdAndTenantId(operationId, tenantId);
    }

    /**
     * Get pending operations for a conversation.
     */
    public List<PendingOperation> getPendingOperationsForConversation(String conversationId, UUID tenantId) {
        return operationRepository.findByConversationIdAndTenantIdOrderByCreatedAtDesc(conversationId, tenantId)
                .stream()
                .filter(op -> op.getStatus() == OperationStatus.PENDING)
                .toList();
    }

    /**
     * Cancel all pending operations for a conversation.
     */
    @Transactional
    public int cancelConversationOperations(String conversationId, UUID tenantId) {
        return operationRepository.cancelConversationOperations(conversationId, tenantId, Instant.now());
    }

    /**
     * Count pending operations for a user.
     */
    public long countPendingOperations(UUID tenantId, UUID userId) {
        return operationRepository.countByTenantIdAndUserIdAndStatus(tenantId, userId, OperationStatus.PENDING);
    }

    /**
     * Expire old pending operations (scheduled task).
     */
    @Scheduled(fixedRate = 60000) // Run every minute
    @Transactional
    public void expireOldOperations() {
        int expired = operationRepository.expireOldOperations(Instant.now());
        if (expired > 0) {
            log.info("Expired {} pending operations", expired);
        }
    }
}
