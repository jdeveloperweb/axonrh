package com.axonrh.notification.repository;

import com.axonrh.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Optional<Notification> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<Notification> findByTenantIdAndIdAndUserId(UUID tenantId, UUID id, UUID userId);

    Page<Notification> findByTenantIdAndUserId(UUID tenantId, UUID userId, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.tenantId = :tenantId " +
           "AND n.userId = :userId AND n.isRead = false " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > CURRENT_TIMESTAMP) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByUser(@Param("tenantId") UUID tenantId,
                                        @Param("userId") UUID userId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.tenantId = :tenantId " +
           "AND n.userId = :userId AND n.isRead = false " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > CURRENT_TIMESTAMP)")
    long countUnreadByUser(@Param("tenantId") UUID tenantId, @Param("userId") UUID userId);

    @Query("SELECT n FROM Notification n WHERE n.tenantId = :tenantId " +
           "AND n.userId = :userId AND n.isArchived = false " +
           "ORDER BY n.createdAt DESC")
    Page<Notification> findActiveByUser(@Param("tenantId") UUID tenantId,
                                        @Param("userId") UUID userId,
                                        Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.tenantId = :tenantId " +
           "AND n.userId = :userId AND n.category = :category " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findByCategory(@Param("tenantId") UUID tenantId,
                                      @Param("userId") UUID userId,
                                      @Param("category") String category);

    @Query("SELECT n FROM Notification n WHERE n.sourceType = :sourceType " +
           "AND n.sourceId = :sourceId")
    List<Notification> findBySource(@Param("sourceType") String sourceType,
                                    @Param("sourceId") UUID sourceId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt " +
           "WHERE n.tenantId = :tenantId AND n.userId = :userId AND n.isRead = false")
    void markAllAsRead(@Param("tenantId") UUID tenantId,
                       @Param("userId") UUID userId,
                       @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.tenantId = :tenantId " +
           "AND n.createdAt < :cutoffDate AND n.isRead = true")
    int deleteOldNotifications(@Param("tenantId") UUID tenantId,
                               @Param("cutoffDate") LocalDateTime cutoffDate);

    @Query("SELECT n.type, COUNT(n) FROM Notification n " +
           "WHERE n.tenantId = :tenantId AND n.userId = :userId " +
           "GROUP BY n.type")
    List<Object[]> countByType(@Param("tenantId") UUID tenantId, @Param("userId") UUID userId);
}
