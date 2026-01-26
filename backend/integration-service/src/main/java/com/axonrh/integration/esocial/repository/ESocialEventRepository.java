package com.axonrh.integration.esocial.repository;

import com.axonrh.integration.esocial.entity.ESocialEvent;
import com.axonrh.integration.esocial.entity.enums.ESocialEventStatus;
import com.axonrh.integration.esocial.entity.enums.ESocialEventType;
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
public interface ESocialEventRepository extends JpaRepository<ESocialEvent, UUID> {

    Optional<ESocialEvent> findByTenantIdAndId(UUID tenantId, UUID id);

    Page<ESocialEvent> findByTenantId(UUID tenantId, Pageable pageable);

    List<ESocialEvent> findByTenantIdAndStatus(UUID tenantId, ESocialEventStatus status);

    List<ESocialEvent> findByTenantIdAndEventType(UUID tenantId, ESocialEventType eventType);

    @Query("SELECT e FROM ESocialEvent e WHERE e.tenantId = :tenantId " +
           "AND e.status = 'PENDING' ORDER BY e.createdAt ASC")
    List<ESocialEvent> findPendingEvents(@Param("tenantId") UUID tenantId);

    @Query("SELECT e FROM ESocialEvent e WHERE e.tenantId = :tenantId " +
           "AND e.status = 'TRANSMITTED' AND e.protocolNumber IS NOT NULL")
    List<ESocialEvent> findAwaitingResponse(@Param("tenantId") UUID tenantId);

    @Query("SELECT e FROM ESocialEvent e WHERE e.tenantId = :tenantId " +
           "AND e.status = 'ERROR' AND e.retryCount < :maxRetries")
    List<ESocialEvent> findRetryableErrors(@Param("tenantId") UUID tenantId,
                                           @Param("maxRetries") int maxRetries);

    @Query("SELECT e FROM ESocialEvent e WHERE e.tenantId = :tenantId " +
           "AND e.employeeId = :employeeId ORDER BY e.createdAt DESC")
    List<ESocialEvent> findByEmployee(@Param("tenantId") UUID tenantId,
                                      @Param("employeeId") UUID employeeId);

    @Query("SELECT e FROM ESocialEvent e WHERE e.tenantId = :tenantId " +
           "AND e.createdAt BETWEEN :startDate AND :endDate")
    List<ESocialEvent> findByDateRange(@Param("tenantId") UUID tenantId,
                                       @Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);

    List<ESocialEvent> findByTenantIdAndReferenceIdAndReferenceType(UUID tenantId, UUID referenceId, String referenceType);

    @Query("SELECT e.eventType, COUNT(e) FROM ESocialEvent e " +
           "WHERE e.tenantId = :tenantId GROUP BY e.eventType")
    List<Object[]> countByEventType(@Param("tenantId") UUID tenantId);

    @Query("SELECT e.status, COUNT(e) FROM ESocialEvent e " +
           "WHERE e.tenantId = :tenantId GROUP BY e.status")
    List<Object[]> countByStatus(@Param("tenantId") UUID tenantId);

    long countByTenantIdAndStatus(UUID tenantId, ESocialEventStatus status);

    boolean existsByTenantIdAndEmployeeIdAndEventTypeAndStatusIn(
            UUID tenantId, UUID employeeId, ESocialEventType eventType, List<ESocialEventStatus> statuses);
}
