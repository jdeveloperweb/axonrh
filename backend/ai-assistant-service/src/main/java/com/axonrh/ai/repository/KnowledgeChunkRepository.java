package com.axonrh.ai.repository;

import com.axonrh.ai.entity.KnowledgeChunk;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeChunkRepository extends MongoRepository<KnowledgeChunk, String> {
    
    @Query(value = "{'tenantId': ?0}", fields = "{'content': 0}")
    List<KnowledgeChunk> findByTenantIdWithoutContent(UUID tenantId);

    List<KnowledgeChunk> findByTenantId(UUID tenantId);
    List<KnowledgeChunk> findByDocumentIdOrderByChunkIndexAsc(UUID documentId);
    void deleteByDocumentId(UUID documentId);
}
