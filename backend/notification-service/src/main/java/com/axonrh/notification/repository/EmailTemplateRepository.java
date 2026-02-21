package com.axonrh.notification.repository;

import com.axonrh.notification.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, UUID> {

    Optional<EmailTemplate> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<EmailTemplate> findByTenantIdAndCode(UUID tenantId, String code);

    @Query("SELECT t FROM EmailTemplate t WHERE t.tenantId = :systemTenantId AND t.code = :code AND t.isSystem = true")
    Optional<EmailTemplate> findSystemTemplate(@Param("systemTenantId") UUID systemTenantId,
                                               @Param("code") String code);

    List<EmailTemplate> findByTenantId(UUID tenantId);

    @Query("SELECT t FROM EmailTemplate t WHERE t.tenantId = :tenantId " +
           "OR (t.isSystem = true AND t.tenantId = :systemTenantId)")
    List<EmailTemplate> findByTenantIdOrSystem(@Param("tenantId") UUID tenantId,
                                               @Param("systemTenantId") UUID systemTenantId);

    List<EmailTemplate> findByTenantIdAndCategory(UUID tenantId, String category);

    @Query("SELECT t FROM EmailTemplate t WHERE t.tenantId = :tenantId AND t.isActive = true")
    List<EmailTemplate> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);
}
