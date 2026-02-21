package com.axonrh.ai.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "knowledge_chunks")
@CompoundIndex(name = "tenant_doc_idx", def = "{'tenantId': 1, 'documentId': 1}")
public class KnowledgeChunk {

    @Id
    private String id;

    @Indexed
    private UUID tenantId;

    @Indexed
    private UUID documentId;

    private String documentTitle;

    private String content;

    private int chunkIndex;

    private List<Float> embedding;

    private String metadata;
}
