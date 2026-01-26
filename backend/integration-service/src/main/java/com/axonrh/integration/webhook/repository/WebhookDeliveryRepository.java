package com.axonrh.integration.webhook.repository;

import com.axonrh.integration.webhook.entity.WebhookDelivery;
import com.axonrh.integration.webhook.entity.WebhookDelivery.DeliveryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebhookDeliveryRepository extends JpaRepository<WebhookDelivery, UUID> {

    Optional<WebhookDelivery> findByTenantIdAndId(UUID tenantId, UUID id);

    List<WebhookDelivery> findByTenantIdAndWebhookId(UUID tenantId, UUID webhookId);

    Page<WebhookDelivery> findByTenantIdAndWebhookId(UUID tenantId, UUID webhookId, Pageable pageable);

    @Query("SELECT d FROM WebhookDelivery d WHERE d.tenantId = :tenantId " +
           "AND d.webhook.id = :webhookId ORDER BY d.createdAt DESC")
    List<WebhookDelivery> findRecentDeliveries(@Param("tenantId") UUID tenantId,
                                               @Param("webhookId") UUID webhookId,
                                               Pageable pageable);

    @Query("SELECT d FROM WebhookDelivery d WHERE d.tenantId = :tenantId " +
           "AND d.status = 'FAILED' AND d.retryCount < :maxRetries " +
           "ORDER BY d.createdAt ASC")
    List<WebhookDelivery> findRetryable(@Param("tenantId") UUID tenantId,
                                        @Param("maxRetries") int maxRetries);

    @Query("SELECT d.status, COUNT(d) FROM WebhookDelivery d " +
           "WHERE d.webhook.id = :webhookId GROUP BY d.status")
    List<Object[]> countByStatusForWebhook(@Param("webhookId") UUID webhookId);

    @Query("SELECT d FROM WebhookDelivery d WHERE d.tenantId = :tenantId " +
           "AND d.createdAt BETWEEN :startDate AND :endDate")
    List<WebhookDelivery> findByDateRange(@Param("tenantId") UUID tenantId,
                                          @Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate);

    long countByTenantIdAndStatus(UUID tenantId, DeliveryStatus status);

    @Query("SELECT AVG(d.durationMs) FROM WebhookDelivery d " +
           "WHERE d.webhook.id = :webhookId AND d.status = 'SUCCESS'")
    Double calculateAverageDuration(@Param("webhookId") UUID webhookId);
}
