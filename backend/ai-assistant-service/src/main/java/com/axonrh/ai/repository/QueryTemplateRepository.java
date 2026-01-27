package com.axonrh.ai.repository;

import com.axonrh.ai.entity.QueryTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QueryTemplateRepository extends JpaRepository<QueryTemplate, UUID> {

    UUID SYSTEM_TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    List<QueryTemplate> findByTenantIdAndIsActiveTrue(UUID tenantId);

    List<QueryTemplate> findByIntentAndIsActiveTrue(String intent);

    Optional<QueryTemplate> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<QueryTemplate> findByTenantIdAndNameAndIsActiveTrue(UUID tenantId, String name);

    @Query("SELECT qt FROM QueryTemplate qt WHERE (qt.tenantId = :tenantId " +
           "OR qt.tenantId = :defaultId) " +
           "AND qt.intent = :intent AND qt.isActive = true ORDER BY qt.usageCount DESC")
    List<QueryTemplate> findByIntentWithDefaultsInternal(@Param("tenantId") UUID tenantId, @Param("intent") String intent, @Param("defaultId") UUID defaultId);

    default List<QueryTemplate> findByIntentWithDefaults(UUID tenantId, String intent) {
        return findByIntentWithDefaultsInternal(tenantId, intent, SYSTEM_TENANT_ID);
    }

    @Query("SELECT qt FROM QueryTemplate qt WHERE (qt.tenantId = :tenantId " +
           "OR qt.tenantId = :defaultId) " +
           "AND qt.isActive = true ORDER BY qt.usageCount DESC")
    List<QueryTemplate> findAllWithDefaultsInternal(@Param("tenantId") UUID tenantId, @Param("defaultId") UUID defaultId);

    default List<QueryTemplate> findAllWithDefaults(UUID tenantId) {
        return findAllWithDefaultsInternal(tenantId, SYSTEM_TENANT_ID);
    }
}
