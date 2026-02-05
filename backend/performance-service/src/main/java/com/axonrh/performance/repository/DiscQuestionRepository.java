package com.axonrh.performance.repository;

import com.axonrh.performance.entity.DiscQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DiscQuestionRepository extends JpaRepository<DiscQuestion, UUID> {

    @Query("SELECT q FROM DiscQuestion q LEFT JOIN FETCH q.options " +
           "WHERE q.questionnaire.id = :questionnaireId AND q.isActive = true " +
           "ORDER BY q.questionOrder")
    List<DiscQuestion> findByQuestionnaireIdWithOptions(@Param("questionnaireId") UUID questionnaireId);

    List<DiscQuestion> findByQuestionnaireIdAndIsActiveTrueOrderByQuestionOrderAsc(UUID questionnaireId);

    long countByQuestionnaireId(UUID questionnaireId);
}
