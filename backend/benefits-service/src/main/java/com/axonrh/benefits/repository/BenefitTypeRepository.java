package com.axonrh.benefits.repository;

import com.axonrh.benefits.entity.BenefitType;
import com.axonrh.benefits.enums.BenefitCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BenefitTypeRepository extends JpaRepository<BenefitType, UUID>, JpaSpecificationExecutor<BenefitType> {

    Page<BenefitType> findByTenantId(UUID tenantId, Pageable pageable);

    List<BenefitType> findByTenantIdAndIsActiveTrue(UUID tenantId);

    List<BenefitType> findByTenantIdAndCategory(UUID tenantId, BenefitCategory category);

    Optional<BenefitType> findByTenantIdAndId(UUID tenantId, UUID id);

    boolean existsByTenantIdAndNameIgnoreCase(UUID tenantId, String name);

    boolean existsByTenantIdAndNameIgnoreCaseAndIdNot(UUID tenantId, String name, UUID id);
}
