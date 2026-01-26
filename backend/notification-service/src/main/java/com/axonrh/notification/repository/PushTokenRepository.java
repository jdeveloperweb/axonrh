package com.axonrh.notification.repository;

import com.axonrh.notification.entity.PushToken;
import com.axonrh.notification.entity.PushToken.DeviceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PushTokenRepository extends JpaRepository<PushToken, UUID> {

    Optional<PushToken> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<PushToken> findByTenantIdAndToken(UUID tenantId, String token);

    Optional<PushToken> findByToken(String token);

    List<PushToken> findByTenantIdAndUserId(UUID tenantId, UUID userId);

    @Query("SELECT t FROM PushToken t WHERE t.tenantId = :tenantId " +
           "AND t.userId = :userId AND t.isActive = true")
    List<PushToken> findActiveByUser(@Param("tenantId") UUID tenantId,
                                     @Param("userId") UUID userId);

    @Query("SELECT t FROM PushToken t WHERE t.tenantId = :tenantId " +
           "AND t.userId IN :userIds AND t.isActive = true")
    List<PushToken> findActiveByUsers(@Param("tenantId") UUID tenantId,
                                      @Param("userIds") List<UUID> userIds);

    @Query("SELECT t FROM PushToken t WHERE t.tenantId = :tenantId " +
           "AND t.employeeId = :employeeId AND t.isActive = true")
    List<PushToken> findActiveByEmployee(@Param("tenantId") UUID tenantId,
                                         @Param("employeeId") UUID employeeId);

    List<PushToken> findByTenantIdAndDeviceType(UUID tenantId, DeviceType deviceType);

    @Query("SELECT t.deviceType, COUNT(t) FROM PushToken t " +
           "WHERE t.tenantId = :tenantId AND t.isActive = true " +
           "GROUP BY t.deviceType")
    List<Object[]> countActiveByDeviceType(@Param("tenantId") UUID tenantId);

    long countByTenantIdAndIsActive(UUID tenantId, boolean isActive);
}
