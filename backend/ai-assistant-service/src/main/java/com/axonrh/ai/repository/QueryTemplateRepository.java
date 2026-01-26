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

    List<QueryTemplate> findByTenantIdAndIsActiveTrue(UUID tenantId);

    List<QueryTemplate> findByIntentAndIsActiveTrue(String intent);

    Optional<QueryTemplate> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<QueryTemplate> findByTenantIdAndNameAndIsActiveTrue(UUID tenantId, String name);

    @Query("SELECT qt FROM QueryTemplate qt WHERE (qt.tenantId = :tenantId " +
           "OR qt.tenantId = '00000000-0000-0000-0000-000000000000') " +
           "AND qt.intent = :intent AND qt.isActive = true ORDER BY qt.usageCount DESC")
    List<QueryTemplate> findByIntentWithDefaults(@Param("tenantId") UUID tenantId, @Param("intent") String intent);

    @Query("SELECT qt FROM QueryTemplate qt WHERE (qt.tenantId = :tenantId " +
           "OR qt.tenantId = '00000000-0000-0000-0000-000000000000') " +
           "AND qt.isActive = true ORDER BY qt.usageCount DESC")
    List<QueryTemplate> findAllWithDefaults(@Param("tenantId") UUID tenantId);
}
