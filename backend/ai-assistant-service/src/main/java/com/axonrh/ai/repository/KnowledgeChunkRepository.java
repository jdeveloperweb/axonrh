package com.axonrh.ai.repository;

import com.axonrh.ai.entity.KnowledgeChunk;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeChunkRepository extends MongoRepository<KnowledgeChunk, String> {
    List<KnowledgeChunk> findByTenantId(UUID tenantId);
    List<KnowledgeChunk> findByDocumentIdOrderByChunkIndexAsc(UUID documentId);
    void deleteByDocumentId(UUID documentId);
}
