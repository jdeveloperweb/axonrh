package com.axonrh.ai.controller;

import com.axonrh.ai.dto.*;
import com.axonrh.ai.entity.PendingOperation;
import com.axonrh.ai.entity.PendingOperation.OperationStatus;
import com.axonrh.ai.repository.PendingOperationRepository;
import com.axonrh.ai.service.DataModificationExecutorService;
import com.axonrh.ai.service.DataModificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for data modification operations.
 * Provides endpoints for creating, confirming, rejecting, and managing pending operations.
 */
@RestController
@RequestMapping("/api/v1/ai/data-operations")
@RequiredArgsConstructor
@Slf4j
public class DataModificationController {

    private final DataModificationService dataModificationService;
    private final DataModificationExecutorService executorService;
    private final PendingOperationRepository operationRepository;

    /**
     * Process a natural language data modification command.
     * Creates a pending operation that requires confirmation.
     */
    @PostMapping("/process")
    public ResponseEntity<DataModificationResponse> processCommand(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody DataModificationRequest request) {

        log.info("Processing modification command from user: {}", userId);

        DataModificationResponse response = dataModificationService.processModificationCommand(
                request.getCommand(),
                tenantId,
                userId,
                request.getConversationId(),
                request.getContext());

        return ResponseEntity.ok(response);
    }

    /**
     * Confirm or reject a pending operation.
     */
    @PostMapping("/confirm")
    public ResponseEntity<OperationConfirmationResponse> confirmOperation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody OperationConfirmationRequest request) {

        log.info("Processing confirmation for operation: {}, confirmed: {}",
                request.getOperationId(), request.isConfirmed());

        OperationConfirmationResponse response = executorService.processConfirmation(
                request, tenantId, userId);

        return ResponseEntity.ok(response);
    }

    /**
     * Rollback an executed operation.
     */
    @PostMapping("/{operationId}/rollback")
    public ResponseEntity<OperationConfirmationResponse> rollbackOperation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @PathVariable UUID operationId) {

        log.info("Rolling back operation: {}", operationId);

        OperationConfirmationResponse response = executorService.rollbackOperation(
                operationId, tenantId, userId);

        return ResponseEntity.ok(response);
    }

    /**
     * Get a specific operation by ID.
     */
    @GetMapping("/{operationId}")
    public ResponseEntity<DataModificationResponse> getOperation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID operationId) {

        return executorService.getOperation(operationId, tenantId)
                .map(DataModificationResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * List pending operations for a user.
     */
    @GetMapping("/pending")
    public ResponseEntity<Page<DataModificationResponse>> listPendingOperations(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            Pageable pageable) {

        Page<PendingOperation> operations = operationRepository
                .findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, OperationStatus.PENDING, pageable);

        Page<DataModificationResponse> response = operations.map(DataModificationResponse::fromEntity);
        return ResponseEntity.ok(response);
    }

    /**
     * List operations for a specific conversation.
     */
    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<List<DataModificationResponse>> listConversationOperations(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable String conversationId) {

        List<PendingOperation> operations = operationRepository
                .findByConversationIdAndTenantIdOrderByCreatedAtDesc(conversationId, tenantId);

        List<DataModificationResponse> response = operations.stream()
                .map(DataModificationResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(response);
    }

    /**
     * Get pending operations count for a user.
     */
    @GetMapping("/pending/count")
    public ResponseEntity<Map<String, Long>> countPendingOperations(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId) {

        long count = executorService.countPendingOperations(tenantId, userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Cancel all pending operations for a conversation.
     */
    @PostMapping("/conversation/{conversationId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelConversationOperations(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable String conversationId) {

        int cancelled = executorService.cancelConversationOperations(conversationId, tenantId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "cancelled", cancelled,
                "message", String.format("%d operação(ões) cancelada(s)", cancelled)
        ));
    }

    /**
     * Get operation statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOperationStats(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {

        List<Object[]> statusStats = operationRepository.getOperationStatsByStatus(tenantId);

        Map<String, Long> byStatus = new java.util.HashMap<>();
        for (Object[] row : statusStats) {
            byStatus.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        return ResponseEntity.ok(Map.of(
                "byStatus", byStatus,
                "total", byStatus.values().stream().mapToLong(Long::longValue).sum()
        ));
    }

    /**
     * Quick confirm endpoint for simple confirmations from chat.
     */
    @PostMapping("/quick-confirm/{operationId}")
    public ResponseEntity<OperationConfirmationResponse> quickConfirm(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @PathVariable UUID operationId) {

        OperationConfirmationRequest request = OperationConfirmationRequest.builder()
                .operationId(operationId)
                .confirmed(true)
                .build();

        OperationConfirmationResponse response = executorService.processConfirmation(
                request, tenantId, userId);

        return ResponseEntity.ok(response);
    }

    /**
     * Quick reject endpoint for simple rejections from chat.
     */
    @PostMapping("/quick-reject/{operationId}")
    public ResponseEntity<OperationConfirmationResponse> quickReject(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @PathVariable UUID operationId,
            @RequestParam(required = false) String reason) {

        OperationConfirmationRequest request = OperationConfirmationRequest.builder()
                .operationId(operationId)
                .confirmed(false)
                .rejectionReason(reason != null ? reason : "Rejeitado pelo usuário")
                .build();

        OperationConfirmationResponse response = executorService.processConfirmation(
                request, tenantId, userId);

        return ResponseEntity.ok(response);
    }
}
