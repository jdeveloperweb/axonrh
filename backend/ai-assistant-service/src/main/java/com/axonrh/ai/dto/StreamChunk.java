package com.axonrh.ai.dto;

import com.axonrh.ai.entity.Conversation.Message.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StreamChunk {
    private String content;
    private boolean done;
    private String finishReason;
    private MessageType type;
    private Usage usage;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Usage {
        private int promptTokens;
        private int completionTokens;
    }
}
