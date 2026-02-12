package com.axonrh.performance.repository;

import com.axonrh.performance.entity.EvaluationForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvaluationFormRepository extends JpaRepository<EvaluationForm, UUID> {
    List<EvaluationForm> findByTenantIdAndActiveTrue(UUID tenantId);
    List<EvaluationForm> findByTenantIdAndIsTemplateTrue(UUID tenantId);
}
