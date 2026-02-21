package com.axonrh.ai.service;

import com.axonrh.ai.entity.KnowledgeChunk;
import com.axonrh.ai.entity.KnowledgeDocument;
import com.axonrh.ai.repository.KnowledgeChunkRepository;
import com.axonrh.ai.repository.KnowledgeDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.apache.tika.Tika;
import java.io.InputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeService {

    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final LlmService llmService;

    @Value("${ai.embeddings.dimensions:1536}")
    private int embeddingDimensions;

    public KnowledgeDocument uploadDocument(UUID tenantId, UUID userId, MultipartFile file,
                                             KnowledgeDocument.DocumentType type, String title, String description) {
        try {
            String content = extractContent(file);
            String contentHash = hashContent(content);

            // Check for duplicate
            Optional<KnowledgeDocument> existing = documentRepository.findByTenantIdAndContentHash(tenantId, contentHash);
            if (existing.isPresent()) {
                log.info("Document with same content already exists: {}", existing.get().getId());
                return existing.get();
            }

            KnowledgeDocument document = KnowledgeDocument.builder()
                    .tenantId(tenantId)
                    .title(title != null && !title.isBlank() ? title : file.getOriginalFilename())
                    .description(description)
                    .documentType(type)
                    .filePath(file.getOriginalFilename())
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .contentHash(contentHash)
                    .isIndexed(false)
                    .isActive(true)
                    .createdBy(userId)
                    .build();

            document = documentRepository.save(document);

            // Index asynchronously
            indexDocumentAsync(document, content);

            return document;
        } catch (Exception e) {
            log.error("Failed to upload document: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload document", e);
        }
    }

    @Async("embeddingExecutor")
    public void indexDocumentAsync(KnowledgeDocument document, String content) {
        try {
            log.info("Starting indexing for document: {} ({})", document.getTitle(), document.getId());

            List<String> textChunks = chunkContent(content, 1000, 100);
            List<KnowledgeChunk> knowledgeChunks = new ArrayList<>();

            // Generate embeddings in batches to stay within limits
            int batchSize = 10;
            for (int i = 0; i < textChunks.size(); i += batchSize) {
                int end = Math.min(i + batchSize, textChunks.size());
                List<String> batch = textChunks.subList(i, end);
                List<List<Float>> embeddings = llmService.generateEmbeddings(batch);

                for (int j = 0; j < batch.size(); j++) {
                    KnowledgeChunk chunk = KnowledgeChunk.builder()
                            .tenantId(document.getTenantId())
                            .documentId(document.getId())
                            .documentTitle(document.getTitle())
                            .content(batch.get(j))
                            .chunkIndex(i + j)
                            .embedding(embeddings.get(j))
                            .build();
                    knowledgeChunks.add(chunk);
                }
            }

            // Persistence in MongoDB
            chunkRepository.saveAll(knowledgeChunks);

            // Update document status
            document.setChunkCount(textChunks.size());
            document.setIsIndexed(true);
            document.setIndexedAt(Instant.now());
            documentRepository.save(document);

            log.info("Successfully indexed document {} with {} chunks", document.getId(), textChunks.size());
        } catch (Exception e) {
            log.error("Failed to index document {}: {}", document.getId(), e.getMessage(), e);
        }
    }

    public void deleteDocumentChunks(UUID documentId) {
        try {
            log.info("Deleting chunks for document: {}", documentId);
            chunkRepository.deleteByDocumentId(documentId);
        } catch (Exception e) {
            log.error("Failed to delete chunks for document {}: {}", documentId, e.getMessage());
        }
    }

    public List<SearchResult> search(String query, UUID tenantId, int topK) {
        try {
            log.debug("Performing knowledge search for tenant {}: {}", tenantId, query);
            List<Float> queryEmbedding = llmService.generateEmbedding(query);
            
            // For now, we fetch all chunks for the tenant and calculate similarity in application
            // In a large-scale system, we would use Milvus or MongoDB Atlas Vector Search
            List<KnowledgeChunk> tenantChunks = chunkRepository.findByTenantId(tenantId);

            if (tenantChunks.isEmpty()) {
                log.info("No chunks found for tenant {}", tenantId);
                return List.of();
            }

            // Calculate similarities and sort
            return tenantChunks.stream()
                    .map(chunk -> {
                        float similarity = cosineSimilarity(queryEmbedding, chunk.getEmbedding());
                        return SearchResult.builder()
                                .documentId(chunk.getDocumentId())
                                .documentTitle(chunk.getDocumentTitle())
                                .content(chunk.getContent())
                                .chunkIndex(chunk.getChunkIndex())
                                .similarity(similarity)
                                .build();
                    })
                    .filter(r -> r.getSimilarity() > 0.65) // Higher threshold for more relevant results
                    .sorted(Comparator.comparing(SearchResult::getSimilarity).reversed())
                    .limit(topK)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Search failed: {}", e.getMessage(), e);
            return List.of();
        }
    }

    public String getContextForQuery(String query, UUID tenantId) {
        List<SearchResult> results = search(query, tenantId, 4);

        if (results.isEmpty()) {
            return "Nenhuma informação relevante encontrada na base de conhecimento para esta consulta.";
        }

        StringBuilder context = new StringBuilder();
        context.append("### CONTEXTO DA BASE DE CONHECIMENTO ###\n");
        context.append("Use as informações abaixo para responder à pergunta do usuário. Se a informação não estiver aqui, diga que não sabe baseado nos manuais.\n\n");
        
        for (SearchResult r : results) {
            context.append(String.format("--- Documento: %s (Relevância: %.2f) ---\n", 
                    r.getDocumentTitle(), r.getSimilarity()));
            context.append(r.getContent()).append("\n\n");
        }
        
        return context.toString();
    }

    private final Tika tika = new Tika();

    private String extractContent(MultipartFile file) throws Exception {
        log.info("Extracting content from file: {} (Type: {})", file.getOriginalFilename(), file.getContentType());
        
        try (InputStream stream = file.getInputStream()) {
            String content = tika.parseToString(stream);
            if (content == null || content.isBlank()) {
                log.warn("Extracted content is empty for file: {}", file.getOriginalFilename());
                return "";
            }
            log.info("Successfully extracted {} characters from {}", content.length(), file.getOriginalFilename());
            return content;
        } catch (Exception e) {
            log.error("Failed to extract content with Tika from {}: {}", file.getOriginalFilename(), e.getMessage());
            // Fallback for simple text files if Tika fails
            return new String(file.getBytes(), StandardCharsets.UTF_8);
        }
    }

    private List<String> chunkContent(String content, int chunkSize, int overlap) {
        List<String> chunks = new ArrayList<>();
        if (content == null || content.isBlank()) return chunks;

        // Split by double newline (paragraphs) first, then by sentence
        String[] paragraphs = content.split("\n\n");
        StringBuilder currentChunk = new StringBuilder();
        
        for (String p : paragraphs) {
            if (currentChunk.length() + p.length() > chunkSize && currentChunk.length() > 0) {
                chunks.add(currentChunk.toString().trim());
                
                // Keep some overlap from the end of current chunk
                int overlapStart = Math.max(0, currentChunk.length() - overlap);
                String overlapText = currentChunk.substring(overlapStart);
                currentChunk = new StringBuilder(overlapText);
            }
            currentChunk.append(p).append("\n\n");
        }
        
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }

        return chunks;
    }

    private String hashContent(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }

    private float cosineSimilarity(List<Float> a, List<Float> b) {
        if (a == null || b == null || a.size() != b.size()) return 0;

        float dotProduct = 0;
        float normA = 0;
        float normB = 0;

        for (int i = 0; i < a.size(); i++) {
            dotProduct += a.get(i) * b.get(i);
            normA += a.get(i) * a.get(i);
            normB += b.get(i) * b.get(i);
        }

        if (normA == 0 || normB == 0) return 0;

        return (float) (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)));
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SearchResult {
        private UUID documentId;
        private String documentTitle;
        private String content;
        private int chunkIndex;
        private float similarity;
    }

}
