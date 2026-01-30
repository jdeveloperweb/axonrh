package com.axonrh.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String id;
    private String content;
    private ChatMessage.Role role;
    private String type;
    private String provider;
    private String model;
    private String finishReason;
    private Usage usage;
    private List<ChatMessage.ToolCall> toolCalls;
    private Long responseTimeMs;
    private Instant timestamp;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Usage {
        private int promptTokens;
        private int completionTokens;
        private int totalTokens;
    }
}
