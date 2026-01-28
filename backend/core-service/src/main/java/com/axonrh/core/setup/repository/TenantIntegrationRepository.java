package com.axonrh.core.setup.repository;

import com.axonrh.core.setup.entity.TenantIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantIntegrationRepository extends JpaRepository<TenantIntegration, UUID> {
    Optional<TenantIntegration> findByTenantId(UUID tenantId);
}
