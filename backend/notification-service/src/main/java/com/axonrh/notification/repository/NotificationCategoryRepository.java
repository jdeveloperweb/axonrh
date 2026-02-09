package com.axonrh.notification.repository;

import com.axonrh.notification.entity.NotificationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationCategoryRepository extends JpaRepository<NotificationCategory, UUID> {

    @Query("SELECT c FROM NotificationCategory c WHERE (c.tenantId IS NULL OR c.tenantId = :tenantId) AND c.isActive = true ORDER BY c.displayOrder ASC")
    List<NotificationCategory> findAllActiveByTenant(@Param("tenantId") UUID tenantId);

    Optional<NotificationCategory> findByTenantIdAndCode(UUID tenantId, String code);
    
    Optional<NotificationCategory> findByCodeAndTenantIdIsNull(String code);

    default Optional<NotificationCategory> findByCode(UUID tenantId, String code) {
        return findByTenantIdAndCode(tenantId, code)
                .or(() -> findByCodeAndTenantIdIsNull(code));
    }
}
