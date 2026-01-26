package com.axonrh.employee.repository;

import com.axonrh.employee.entity.ContractTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractTemplateRepository extends JpaRepository<ContractTemplate, UUID> {

    List<ContractTemplate> findByTenantIdAndIsActiveTrueOrderByName(UUID tenantId);

    Optional<ContractTemplate> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<ContractTemplate> findByTenantIdAndContractTypeAndIsDefaultTrue(UUID tenantId, String contractType);

    List<ContractTemplate> findByTenantIdAndContractTypeAndIsActiveTrue(UUID tenantId, String contractType);

    boolean existsByTenantIdAndNameAndVersion(UUID tenantId, String name, Integer version);
}
