package com.axonrh.ai.service;

import com.axonrh.ai.entity.KnowledgeDocument;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeService {

    private final KnowledgeDocumentRepository documentRepository;
    private final LlmService llmService;

    @Value("${ai.embeddings.dimensions:1536}")
    private int embeddingDimensions;

    // In-memory vector store for simplicity (would use Milvus in production)
    private final Map<UUID, List<DocumentChunk>> vectorStore = new HashMap<>();

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
                    .title(title != null ? title : file.getOriginalFilename())
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
            log.info("Starting indexing for document: {}", document.getId());

            List<String> chunks = chunkContent(content, 500, 50);
            List<DocumentChunk> indexedChunks = new ArrayList<>();

            // Generate embeddings in batches
            int batchSize = 10;
            for (int i = 0; i < chunks.size(); i += batchSize) {
                int end = Math.min(i + batchSize, chunks.size());
                List<String> batch = chunks.subList(i, end);
                List<List<Float>> embeddings = llmService.generateEmbeddings(batch);

                for (int j = 0; j < batch.size(); j++) {
                    DocumentChunk chunk = DocumentChunk.builder()
                            .id(UUID.randomUUID())
                            .documentId(document.getId())
                            .documentTitle(document.getTitle())
                            .content(batch.get(j))
                            .chunkIndex(i + j)
                            .embedding(embeddings.get(j))
                            .build();
                    indexedChunks.add(chunk);
                }
            }

            // Store in vector store
            vectorStore.computeIfAbsent(document.getTenantId(), k -> new ArrayList<>()).addAll(indexedChunks);

            // Update document
            document.setChunkCount(chunks.size());
            document.setIsIndexed(true);
            document.setIndexedAt(Instant.now());
            documentRepository.save(document);

            log.info("Indexed document {} with {} chunks", document.getId(), chunks.size());
        } catch (Exception e) {
            log.error("Failed to index document {}: {}", document.getId(), e.getMessage(), e);
        }
    }

    public List<SearchResult> search(String query, UUID tenantId, int topK) {
        try {
            List<Float> queryEmbedding = llmService.generateEmbedding(query);
            List<DocumentChunk> tenantChunks = vectorStore.getOrDefault(tenantId, List.of());

            if (tenantChunks.isEmpty()) {
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
                    .filter(r -> r.getSimilarity() > 0.5) // Threshold
                    .sorted(Comparator.comparing(SearchResult::getSimilarity).reversed())
                    .limit(topK)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Search failed: {}", e.getMessage(), e);
            return List.of();
        }
    }

    public String getContextForQuery(String query, UUID tenantId) {
        List<SearchResult> results = search(query, tenantId, 3);

        if (results.isEmpty()) {
            return "";
        }

        return results.stream()
                .map(r -> String.format("--- De: %s ---\n%s", r.getDocumentTitle(), r.getContent()))
                .collect(Collectors.joining("\n\n"));
    }

    private String extractContent(MultipartFile file) throws Exception {
        String contentType = file.getContentType();

        if (contentType != null && contentType.contains("text")) {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
                return reader.lines().collect(Collectors.joining("\n"));
            }
        }

        // For PDF and other formats, would use Apache PDFBox or Tika
        // For now, just read as text
        return new String(file.getBytes(), StandardCharsets.UTF_8);
    }

    private List<String> chunkContent(String content, int chunkSize, int overlap) {
        List<String> chunks = new ArrayList<>();
        String[] sentences = content.split("(?<=[.!?])\\s+");

        StringBuilder currentChunk = new StringBuilder();
        int currentSize = 0;

        for (String sentence : sentences) {
            int sentenceWords = sentence.split("\\s+").length;

            if (currentSize + sentenceWords > chunkSize && currentSize > 0) {
                chunks.add(currentChunk.toString().trim());

                // Keep overlap
                String[] words = currentChunk.toString().split("\\s+");
                currentChunk = new StringBuilder();
                int start = Math.max(0, words.length - overlap);
                for (int i = start; i < words.length; i++) {
                    currentChunk.append(words[i]).append(" ");
                }
                currentSize = Math.min(overlap, words.length);
            }

            currentChunk.append(sentence).append(" ");
            currentSize += sentenceWords;
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
        if (a.size() != b.size()) return 0;

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
    public static class DocumentChunk {
        private UUID id;
        private UUID documentId;
        private String documentTitle;
        private String content;
        private int chunkIndex;
        private List<Float> embedding;
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
