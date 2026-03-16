package com.axonrh.core.setup.repository;

import com.axonrh.core.setup.entity.PrivacyPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrivacyPolicyRepository extends JpaRepository<PrivacyPolicy, UUID> {
    Optional<PrivacyPolicy> findByTenantId(UUID tenantId);
    boolean existsByTenantId(UUID tenantId);
}
