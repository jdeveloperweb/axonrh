package com.axonrh.notification.repository;

import com.axonrh.notification.entity.EmailLog;
import com.axonrh.notification.entity.EmailLog.EmailStatus;
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
public interface EmailLogRepository extends JpaRepository<EmailLog, UUID> {

    Optional<EmailLog> findByTenantIdAndId(UUID tenantId, UUID id);

    List<EmailLog> findByTenantId(UUID tenantId);

    Page<EmailLog> findByTenantId(UUID tenantId, Pageable pageable);

    List<EmailLog> findByTenantIdAndRecipientEmail(UUID tenantId, String recipientEmail);

    List<EmailLog> findByTenantIdAndStatus(UUID tenantId, EmailStatus status);

    Optional<EmailLog> findByMessageId(String messageId);

    @Query("SELECT e FROM EmailLog e WHERE e.tenantId = :tenantId " +
           "AND e.status = 'PENDING' AND e.retryCount < :maxRetries " +
           "ORDER BY e.createdAt ASC")
    List<EmailLog> findPendingEmails(@Param("tenantId") UUID tenantId,
                                     @Param("maxRetries") int maxRetries);

    @Query("SELECT e FROM EmailLog e WHERE e.tenantId = :tenantId " +
           "AND e.status = 'FAILED' AND e.retryCount < :maxRetries " +
           "ORDER BY e.createdAt ASC")
    List<EmailLog> findRetryableEmails(@Param("tenantId") UUID tenantId,
                                       @Param("maxRetries") int maxRetries);

    @Query("SELECT e FROM EmailLog e WHERE e.tenantId = :tenantId " +
           "AND e.createdAt BETWEEN :startDate AND :endDate")
    List<EmailLog> findByDateRange(@Param("tenantId") UUID tenantId,
                                   @Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate);

    @Query("SELECT e.status, COUNT(e) FROM EmailLog e " +
           "WHERE e.tenantId = :tenantId GROUP BY e.status")
    List<Object[]> countByStatus(@Param("tenantId") UUID tenantId);

    @Query("SELECT DATE(e.createdAt), COUNT(e) FROM EmailLog e " +
           "WHERE e.tenantId = :tenantId " +
           "AND e.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY DATE(e.createdAt)")
    List<Object[]> countByDay(@Param("tenantId") UUID tenantId,
                              @Param("startDate") LocalDateTime startDate,
                              @Param("endDate") LocalDateTime endDate);

    long countByTenantIdAndStatus(UUID tenantId, EmailStatus status);
}
