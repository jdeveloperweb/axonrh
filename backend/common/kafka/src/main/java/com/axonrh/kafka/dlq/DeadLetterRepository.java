package com.axonrh.kafka.dlq;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio para acesso a Dead Letter Queue.
 */
@Repository
public interface DeadLetterRepository extends JpaRepository<DeadLetterEntry, UUID> {

    /**
     * Busca entradas pendentes por tenant.
     */
    List<DeadLetterEntry> findByTenantIdAndStatus(UUID tenantId, DeadLetterStatus status);

    /**
     * Busca entradas pendentes com paginacao.
     */
    Page<DeadLetterEntry> findByStatusOrderByCreatedAtDesc(DeadLetterStatus status, Pageable pageable);

    /**
     * Busca entradas por tipo de evento.
     */
    List<DeadLetterEntry> findByEventTypeAndStatus(String eventType, DeadLetterStatus status);

    /**
     * Conta entradas pendentes.
     */
    long countByStatus(DeadLetterStatus status);

    /**
     * Conta entradas pendentes por tenant.
     */
    long countByTenantIdAndStatus(UUID tenantId, DeadLetterStatus status);

    /**
     * Busca entradas para retry (limitando tentativas).
     */
    @Query("SELECT d FROM DeadLetterEntry d WHERE d.status = :status AND d.retryCount < :maxRetries ORDER BY d.createdAt ASC")
    List<DeadLetterEntry> findForRetry(
            @Param("status") DeadLetterStatus status,
            @Param("maxRetries") Integer maxRetries,
            Pageable pageable);

    /**
     * Atualiza status de uma entrada.
     */
    @Modifying
    @Query("UPDATE DeadLetterEntry d SET d.status = :status, d.updatedAt = :now WHERE d.id = :id")
    int updateStatus(@Param("id") UUID id, @Param("status") DeadLetterStatus status, @Param("now") Instant now);

    /**
     * Incrementa contador de retry.
     */
    @Modifying
    @Query("UPDATE DeadLetterEntry d SET d.retryCount = d.retryCount + 1, d.lastRetryAt = :now, d.updatedAt = :now WHERE d.id = :id")
    int incrementRetryCount(@Param("id") UUID id, @Param("now") Instant now);

    /**
     * Resolve uma entrada.
     */
    @Modifying
    @Query("UPDATE DeadLetterEntry d SET d.status = 'RESOLVED', d.resolvedAt = :now, d.resolvedBy = :userId, d.resolutionNotes = :notes, d.updatedAt = :now WHERE d.id = :id")
    int resolve(@Param("id") UUID id, @Param("userId") UUID userId, @Param("notes") String notes, @Param("now") Instant now);

    /**
     * Limpa entradas antigas resolvidas.
     */
    @Modifying
    @Query("DELETE FROM DeadLetterEntry d WHERE d.status = 'RESOLVED' AND d.resolvedAt < :before")
    int deleteResolvedBefore(@Param("before") Instant before);
}
