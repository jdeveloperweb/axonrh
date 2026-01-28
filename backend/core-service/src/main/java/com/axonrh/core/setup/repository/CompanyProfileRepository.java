package com.axonrh.core.setup.repository;

import com.axonrh.core.setup.entity.CompanyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyProfileRepository extends JpaRepository<CompanyProfile, UUID> {

    Optional<CompanyProfile> findByTenantId(UUID tenantId);

    java.util.List<CompanyProfile> findAllByCnpj(String cnpj);

    boolean existsByTenantId(UUID tenantId);

    boolean existsByCnpj(String cnpj);
}
