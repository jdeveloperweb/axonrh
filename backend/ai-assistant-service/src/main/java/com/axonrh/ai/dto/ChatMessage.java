package com.axonrh.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private Role role;
    private String content;
    private String name;
    private List<ToolCall> toolCalls;
    private String toolCallId;

    public enum Role {
        SYSTEM,
        USER,
        ASSISTANT,
        TOOL
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToolCall {
        private String id;
        private String type;
        private Function function;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Function {
            private String name;
            private Map<String, Object> arguments;
        }
    }
}
