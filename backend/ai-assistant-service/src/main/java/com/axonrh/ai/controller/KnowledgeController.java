package com.axonrh.ai.controller;

import com.axonrh.ai.entity.KnowledgeChunk;
import com.axonrh.ai.entity.KnowledgeDocument;
import com.axonrh.ai.repository.KnowledgeChunkRepository;
import com.axonrh.ai.repository.KnowledgeDocumentRepository;
import com.axonrh.ai.service.KnowledgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeService knowledgeService;
    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeChunkRepository chunkRepository;

    @PostMapping("/documents")
    public ResponseEntity<KnowledgeDocument> uploadDocument(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") KnowledgeDocument.DocumentType type,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description) {

        KnowledgeDocument document = knowledgeService.uploadDocument(
                tenantId, userId, file, type, title, description);
        return ResponseEntity.ok(document);
    }

    @GetMapping("/documents")
    public ResponseEntity<Page<KnowledgeDocument>> listDocuments(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            Pageable pageable) {

        Page<KnowledgeDocument> documents = documentRepository.findByTenantIdAndIsActiveTrue(tenantId, pageable);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<KnowledgeDocument> getDocument(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id) {

        return documentRepository.findByIdAndTenantId(id, tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Void> deleteDocument(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id) {

        documentRepository.findByIdAndTenantId(id, tenantId).ifPresent(doc -> {
            doc.setIsActive(false);
            documentRepository.save(doc);
            // Also remove chunks to free space and keep search clean
            knowledgeService.deleteDocumentChunks(id);
        });
        return ResponseEntity.ok().build();
    }

    @GetMapping("/documents/{id}/chunks")
    public ResponseEntity<List<KnowledgeChunk>> getDocumentChunks(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id) {
        
        log.info("Fetching chunks for document {} and tenant {}", id, tenantId);
        
        // Safety check if document belongs to tenant
        return documentRepository.findByIdAndTenantId(id, tenantId)
                .<ResponseEntity<List<KnowledgeChunk>>>map(doc -> {
                    List<KnowledgeChunk> chunks = chunkRepository.findByDocumentIdOrderByChunkIndexAsc(id);
                    log.info("Found {} chunks in MongoDB for document {}", chunks.size(), id);
                    if (chunks.isEmpty()) {
                        log.warn("No chunks found in MongoDB. Checking by tenantId...");
                        List<KnowledgeChunk> tenantChunks = chunkRepository.findByTenantId(tenantId);
                        log.info("Total chunks for tenant {} in MongoDB: {}", tenantId, tenantChunks.size());
                    }
                    return ResponseEntity.ok(chunks);
                })
                .orElseGet(() -> {
                    log.error("Document {} not found for tenant {}", id, tenantId);
                    return ResponseEntity.notFound().build();
                });
    }


    @GetMapping("/search")
    public ResponseEntity<List<KnowledgeService.SearchResult>> search(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int limit) {

        List<KnowledgeService.SearchResult> results = knowledgeService.search(query, tenantId, limit);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/stats")
    public ResponseEntity<KnowledgeStats> getStats(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        long indexedDocs = documentRepository.countIndexedDocuments(tenantId);
        Long totalChunks = documentRepository.sumChunkCount(tenantId);

        KnowledgeStats stats = new KnowledgeStats();
        stats.setIndexedDocuments(indexedDocs);
        stats.setTotalChunks(totalChunks != null ? totalChunks : 0);

        return ResponseEntity.ok(stats);
    }

    @lombok.Data
    public static class KnowledgeStats {
        private long indexedDocuments;
        private long totalChunks;
    }
}
