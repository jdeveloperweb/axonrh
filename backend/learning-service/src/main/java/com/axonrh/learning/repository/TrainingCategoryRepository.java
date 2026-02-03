package com.axonrh.learning.repository;

import com.axonrh.learning.entity.TrainingCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TrainingCategoryRepository extends JpaRepository<TrainingCategory, UUID> {
    @Query("SELECT cat FROM TrainingCategory cat WHERE cat.tenantId = :tenantId OR cat.tenantId = '00000000-0000-0000-0000-000000000000'")
    List<TrainingCategory> findByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT cat FROM TrainingCategory cat WHERE (cat.tenantId = :tenantId OR cat.tenantId = '00000000-0000-0000-0000-000000000000') AND cat.isActive = true")
    List<TrainingCategory> findByTenantIdAndIsActiveTrue(@Param("tenantId") UUID tenantId);
}
