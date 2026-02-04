package com.axonrh.ai.repository;

import com.axonrh.ai.entity.PendingOperation;
import com.axonrh.ai.entity.PendingOperation.OperationStatus;
import com.axonrh.ai.entity.PendingOperation.OperationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing pending data modification operations.
 */
@Repository
public interface PendingOperationRepository extends JpaRepository<PendingOperation, UUID> {

    /**
     * Find operation by ID and tenant (security isolation).
     */
    Optional<PendingOperation> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Find all pending operations for a tenant and user.
     */
    Page<PendingOperation> findByTenantIdAndUserIdOrderByCreatedAtDesc(
            UUID tenantId, UUID userId, Pageable pageable);

    /**
     * Find all pending operations for a conversation.
     */
    List<PendingOperation> findByConversationIdAndTenantIdOrderByCreatedAtDesc(
            String conversationId, UUID tenantId);

    /**
     * Find pending operations by status.
     */
    Page<PendingOperation> findByTenantIdAndStatusOrderByCreatedAtDesc(
            UUID tenantId, OperationStatus status, Pageable pageable);

    /**
     * Find all pending operations for a user in a conversation.
     */
    List<PendingOperation> findByConversationIdAndUserIdAndStatus(
            String conversationId, UUID userId, OperationStatus status);

    /**
     * Find operations by target entity.
     */
    List<PendingOperation> findByTenantIdAndTargetTableAndTargetIdAndStatus(
            UUID tenantId, String targetTable, UUID targetId, OperationStatus status);

    /**
     * Count pending operations for a user.
     */
    long countByTenantIdAndUserIdAndStatus(UUID tenantId, UUID userId, OperationStatus status);

    /**
     * Find expired pending operations.
     */
    @Query("SELECT p FROM PendingOperation p WHERE p.status = 'PENDING' AND p.expiresAt < :now")
    List<PendingOperation> findExpiredOperations(@Param("now") Instant now);

    /**
     * Bulk expire old pending operations.
     */
    @Modifying
    @Query("UPDATE PendingOperation p SET p.status = 'EXPIRED', p.updatedAt = :now " +
           "WHERE p.status = 'PENDING' AND p.expiresAt < :now")
    int expireOldOperations(@Param("now") Instant now);

    /**
     * Find operations that need approval by risk level.
     */
    List<PendingOperation> findByTenantIdAndStatusAndRiskLevelInOrderByCreatedAtDesc(
            UUID tenantId, OperationStatus status, List<PendingOperation.RiskLevel> riskLevels);

    /**
     * Find recent operations for audit.
     */
    @Query("SELECT p FROM PendingOperation p WHERE p.tenantId = :tenantId " +
           "AND p.status IN ('EXECUTED', 'ROLLED_BACK') " +
           "AND p.executedAt >= :since ORDER BY p.executedAt DESC")
    List<PendingOperation> findRecentExecutedOperations(
            @Param("tenantId") UUID tenantId, @Param("since") Instant since);

    /**
     * Find operations by type and status.
     */
    Page<PendingOperation> findByTenantIdAndOperationTypeAndStatusOrderByCreatedAtDesc(
            UUID tenantId, OperationType operationType, OperationStatus status, Pageable pageable);

    /**
     * Check if there are any pending operations for a target entity.
     */
    boolean existsByTenantIdAndTargetTableAndTargetIdAndStatus(
            UUID tenantId, String targetTable, UUID targetId, OperationStatus status);

    /**
     * Cancel all pending operations for a conversation.
     */
    @Modifying
    @Query("UPDATE PendingOperation p SET p.status = 'CANCELLED', p.updatedAt = :now " +
           "WHERE p.conversationId = :conversationId AND p.tenantId = :tenantId AND p.status = 'PENDING'")
    int cancelConversationOperations(
            @Param("conversationId") String conversationId,
            @Param("tenantId") UUID tenantId,
            @Param("now") Instant now);

    /**
     * Get operation statistics for a tenant.
     */
    @Query("SELECT p.status, COUNT(p) FROM PendingOperation p " +
           "WHERE p.tenantId = :tenantId GROUP BY p.status")
    List<Object[]> getOperationStatsByStatus(@Param("tenantId") UUID tenantId);

    /**
     * Get operation statistics by type.
     */
    @Query("SELECT p.operationType, COUNT(p) FROM PendingOperation p " +
           "WHERE p.tenantId = :tenantId AND p.createdAt >= :since GROUP BY p.operationType")
    List<Object[]> getOperationStatsByType(@Param("tenantId") UUID tenantId, @Param("since") Instant since);
}
