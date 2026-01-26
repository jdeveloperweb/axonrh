package com.axonrh.ai.repository;

import com.axonrh.ai.entity.AiPrompt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiPromptRepository extends JpaRepository<AiPrompt, UUID> {

    List<AiPrompt> findByTenantIdAndIsActiveTrue(UUID tenantId);

    List<AiPrompt> findByCategoryAndIsActiveTrue(String category);

    Optional<AiPrompt> findByTenantIdAndNameAndIsActiveTrue(UUID tenantId, String name);

    @Query("SELECT p FROM AiPrompt p WHERE (p.tenantId = :tenantId OR p.isSystem = true) " +
           "AND p.name = :name AND p.isActive = true ORDER BY p.version DESC")
    List<AiPrompt> findByNameWithSystem(@Param("tenantId") UUID tenantId, @Param("name") String name);

    @Query("SELECT p FROM AiPrompt p WHERE (p.tenantId = :tenantId OR p.isSystem = true) " +
           "AND p.category = :category AND p.isActive = true")
    List<AiPrompt> findByCategoryWithSystem(@Param("tenantId") UUID tenantId, @Param("category") String category);

    List<AiPrompt> findByIsSystemTrueAndIsActiveTrue();

    @Query("SELECT DISTINCT p.category FROM AiPrompt p WHERE p.isActive = true")
    List<String> findAllCategories();
}
