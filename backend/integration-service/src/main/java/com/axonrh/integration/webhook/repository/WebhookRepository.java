package com.axonrh.integration.webhook.repository;

import com.axonrh.integration.webhook.entity.Webhook;
import com.axonrh.integration.webhook.entity.Webhook.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebhookRepository extends JpaRepository<Webhook, UUID> {

    Optional<Webhook> findByTenantIdAndId(UUID tenantId, UUID id);

    List<Webhook> findByTenantId(UUID tenantId);

    @Query("SELECT w FROM Webhook w WHERE w.tenantId = :tenantId " +
           "AND w.eventType = :eventType AND w.isActive = true")
    List<Webhook> findActiveByEventType(@Param("tenantId") UUID tenantId,
                                        @Param("eventType") EventType eventType);

    @Query("SELECT w FROM Webhook w WHERE w.tenantId = :tenantId AND w.isActive = true")
    List<Webhook> findAllActive(@Param("tenantId") UUID tenantId);

    @Query("SELECT w.eventType, COUNT(w) FROM Webhook w " +
           "WHERE w.tenantId = :tenantId GROUP BY w.eventType")
    List<Object[]> countByEventType(@Param("tenantId") UUID tenantId);

    long countByTenantIdAndIsActive(UUID tenantId, boolean isActive);
}
