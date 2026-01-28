package com.axonrh.core.setup.repository;

import com.axonrh.core.setup.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findByCnpj(String cnpj);
    Optional<Tenant> findBySubdomain(String subdomain);
}
