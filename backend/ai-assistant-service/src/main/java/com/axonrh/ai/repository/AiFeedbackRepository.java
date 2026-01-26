package com.axonrh.ai.repository;

import com.axonrh.ai.entity.AiFeedback;
import com.axonrh.ai.entity.AiFeedback.FeedbackType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AiFeedbackRepository extends JpaRepository<AiFeedback, UUID> {

    Page<AiFeedback> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    List<AiFeedback> findByConversationId(String conversationId);

    List<AiFeedback> findByTenantIdAndFeedbackType(UUID tenantId, FeedbackType type);

    @Query("SELECT AVG(f.rating) FROM AiFeedback f WHERE f.tenantId = :tenantId " +
           "AND f.createdAt BETWEEN :start AND :end")
    Double getAverageRating(@Param("tenantId") UUID tenantId,
                            @Param("start") Instant start,
                            @Param("end") Instant end);

    @Query("SELECT f.feedbackType, COUNT(f) FROM AiFeedback f WHERE f.tenantId = :tenantId " +
           "AND f.createdAt BETWEEN :start AND :end GROUP BY f.feedbackType")
    List<Object[]> getFeedbackDistribution(@Param("tenantId") UUID tenantId,
                                           @Param("start") Instant start,
                                           @Param("end") Instant end);

    @Query("SELECT COUNT(f) FROM AiFeedback f WHERE f.tenantId = :tenantId AND f.rating >= 4")
    long countPositiveFeedback(@Param("tenantId") UUID tenantId);

    @Query("SELECT COUNT(f) FROM AiFeedback f WHERE f.tenantId = :tenantId AND f.rating <= 2")
    long countNegativeFeedback(@Param("tenantId") UUID tenantId);
}
