package com.axonrh.ai.repository;

import com.axonrh.ai.entity.AiIntent;
import com.axonrh.ai.entity.AiIntent.ActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiIntentRepository extends JpaRepository<AiIntent, UUID> {

    List<AiIntent> findByIsActiveTrue();

    List<AiIntent> findByCategoryAndIsActiveTrue(String category);

    List<AiIntent> findByActionTypeAndIsActiveTrue(ActionType actionType);

    Optional<AiIntent> findByNameAndIsActiveTrue(String name);

    List<AiIntent> findByIsActiveTrueOrderByNameAsc();
}
