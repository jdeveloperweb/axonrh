package com.axonrh.performance.repository;

import com.axonrh.performance.entity.DiscQuestionnaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DiscQuestionnaireRepository extends JpaRepository<DiscQuestionnaire, UUID> {

    List<DiscQuestionnaire> findByTenantIdAndIsActiveTrue(UUID tenantId);

    Optional<DiscQuestionnaire> findByTenantIdAndId(UUID tenantId, UUID id);

    @Query("SELECT q FROM DiscQuestionnaire q WHERE (q.tenantId = :tenantId OR q.isDefault = true) AND q.isActive = true")
    List<DiscQuestionnaire> findAvailableQuestionnaires(@Param("tenantId") UUID tenantId);

    @Query("SELECT q FROM DiscQuestionnaire q WHERE q.isDefault = true AND q.isActive = true")
    Optional<DiscQuestionnaire> findDefaultQuestionnaire();

    @Query("SELECT q FROM DiscQuestionnaire q LEFT JOIN FETCH q.questions qs LEFT JOIN FETCH qs.options " +
           "WHERE q.id = :id")
    Optional<DiscQuestionnaire> findByIdWithQuestions(@Param("id") UUID id);
}
