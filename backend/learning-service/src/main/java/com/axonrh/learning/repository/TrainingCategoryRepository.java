package com.axonrh.learning.repository;

import com.axonrh.learning.entity.TrainingCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TrainingCategoryRepository extends JpaRepository<TrainingCategory, UUID> {
    List<TrainingCategory> findByTenantId(UUID tenantId);
    List<TrainingCategory> findByTenantIdAndIsActiveTrue(UUID tenantId);
}
