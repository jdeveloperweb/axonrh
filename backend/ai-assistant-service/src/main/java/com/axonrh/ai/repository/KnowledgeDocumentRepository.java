package com.axonrh.ai.repository;

import com.axonrh.ai.entity.KnowledgeDocument;
import com.axonrh.ai.entity.KnowledgeDocument.DocumentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, UUID> {

    Page<KnowledgeDocument> findByTenantIdAndIsActiveTrue(UUID tenantId, Pageable pageable);

    List<KnowledgeDocument> findByTenantIdAndDocumentTypeAndIsActiveTrue(UUID tenantId, DocumentType type);

    List<KnowledgeDocument> findByTenantIdAndIsIndexedFalseAndIsActiveTrue(UUID tenantId);

    Optional<KnowledgeDocument> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<KnowledgeDocument> findByTenantIdAndContentHash(UUID tenantId, String contentHash);

    @Query("SELECT d FROM KnowledgeDocument d WHERE d.tenantId = :tenantId AND d.isActive = true " +
           "AND (LOWER(d.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<KnowledgeDocument> searchDocuments(@Param("tenantId") UUID tenantId,
                                             @Param("search") String search,
                                             Pageable pageable);

    @Query("SELECT COUNT(d) FROM KnowledgeDocument d WHERE d.tenantId = :tenantId AND d.isIndexed = true AND d.isActive = true")
    long countIndexedDocuments(@Param("tenantId") UUID tenantId);

    @Query("SELECT SUM(d.chunkCount) FROM KnowledgeDocument d WHERE d.tenantId = :tenantId AND d.isIndexed = true AND d.isActive = true")
    Long sumChunkCount(@Param("tenantId") UUID tenantId);
}
