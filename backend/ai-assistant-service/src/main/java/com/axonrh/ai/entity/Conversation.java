package com.axonrh.ai.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "conversations")
@CompoundIndex(name = "tenant_user_idx", def = "{'tenantId': 1, 'userId': 1}")
@CompoundIndex(name = "tenant_status_idx", def = "{'tenantId': 1, 'status': 1}")
public class Conversation {

    @Id
    private String id;

    @Indexed
    private UUID tenantId;

    @Indexed
    private UUID userId;

    private String title;

    @Builder.Default
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    private String summary;

    private ConversationContext context;

    @Builder.Default
    private ConversationMetadata metadata = new ConversationMetadata();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    private Instant closedAt;

    public enum ConversationStatus {
        ACTIVE,
        ARCHIVED,
        DELETED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        private String id;
        private MessageRole role;
        private String content;
        private MessageType type;
        private List<ToolCall> toolCalls;
        private ToolResult toolResult;
        private Integer tokenCount;
        private Map<String, Object> metadata;
        private Instant timestamp;

        public enum MessageRole {
            SYSTEM,
            USER,
            ASSISTANT,
            TOOL
        }

        public enum MessageType {
            TEXT,
            QUERY_RESULT,
            CALCULATION,
            ERROR,
            SUGGESTION
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToolCall {
        private String id;
        private String name;
        private Map<String, Object> arguments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToolResult {
        private String toolCallId;
        private boolean success;
        private Object result;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationContext {
        private String companyName;
        private String userName;
        private String userRole;
        private String department;
        private List<String> permissions;
        private Map<String, Object> additionalContext;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationMetadata {
        @Builder.Default
        private int messageCount = 0;
        @Builder.Default
        private int totalTokensInput = 0;
        @Builder.Default
        private int totalTokensOutput = 0;
        private String lastIntent;
        @Builder.Default
        private List<String> topicsDiscussed = new ArrayList<>();
        private Double averageResponseTimeMs;
        private Integer feedbackRating;
        private String feedbackText;
    }

    public void addMessage(Message message) {
        if (this.messages == null) {
            this.messages = new ArrayList<>();
        }
        this.messages.add(message);
        this.metadata.setMessageCount(this.messages.size());
    }

    public List<Message> getRecentMessages(int count) {
        if (messages == null || messages.isEmpty()) {
            return List.of();
        }
        int start = Math.max(0, messages.size() - count);
        return messages.subList(start, messages.size());
    }
}
