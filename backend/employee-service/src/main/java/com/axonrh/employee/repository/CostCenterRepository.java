package com.axonrh.employee.repository;

import com.axonrh.employee.entity.CostCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CostCenterRepository extends JpaRepository<CostCenter, UUID> {

    List<CostCenter> findByTenantIdAndIsActiveTrueOrderByName(UUID tenantId);

    Optional<CostCenter> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<CostCenter> findByTenantIdAndCode(UUID tenantId, String code);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);

    long countByTenantIdAndIsActiveTrue(UUID tenantId);
}
