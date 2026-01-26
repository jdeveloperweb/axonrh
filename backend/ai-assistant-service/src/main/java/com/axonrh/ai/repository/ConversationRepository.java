package com.axonrh.ai.repository;

import com.axonrh.ai.entity.Conversation;
import com.axonrh.ai.entity.Conversation.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {

    Page<Conversation> findByTenantIdAndUserIdAndStatusOrderByUpdatedAtDesc(
            UUID tenantId, UUID userId, ConversationStatus status, Pageable pageable);

    Page<Conversation> findByTenantIdAndUserIdOrderByUpdatedAtDesc(
            UUID tenantId, UUID userId, Pageable pageable);

    List<Conversation> findByTenantIdAndUserIdAndStatusAndUpdatedAtAfter(
            UUID tenantId, UUID userId, ConversationStatus status, Instant after);

    Optional<Conversation> findByIdAndTenantId(String id, UUID tenantId);

    @Query("{'tenantId': ?0, 'userId': ?1, 'status': 'ACTIVE', 'updatedAt': {'$gte': ?2}}")
    List<Conversation> findRecentActiveConversations(UUID tenantId, UUID userId, Instant since);

    @Query(value = "{'tenantId': ?0, 'title': {'$regex': ?1, '$options': 'i'}}")
    Page<Conversation> searchByTitle(UUID tenantId, String titlePattern, Pageable pageable);

    @Aggregation(pipeline = {
        "{'$match': {'tenantId': ?0, 'createdAt': {'$gte': ?1, '$lte': ?2}}}",
        "{'$group': {'_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$createdAt'}}, 'count': {'$sum': 1}}}"
    })
    List<DailyConversationCount> countConversationsByDay(UUID tenantId, Instant start, Instant end);

    @Aggregation(pipeline = {
        "{'$match': {'tenantId': ?0}}",
        "{'$unwind': '$messages'}",
        "{'$group': {'_id': null, 'totalMessages': {'$sum': 1}, 'avgMessagesPerConversation': {'$avg': {'$size': '$messages'}}}}"
    })
    ConversationStats getConversationStats(UUID tenantId);

    long countByTenantIdAndStatus(UUID tenantId, ConversationStatus status);

    void deleteByTenantIdAndStatusAndUpdatedAtBefore(UUID tenantId, ConversationStatus status, Instant before);

    interface DailyConversationCount {
        String getId();
        int getCount();
    }

    interface ConversationStats {
        int getTotalMessages();
        double getAvgMessagesPerConversation();
    }
}
