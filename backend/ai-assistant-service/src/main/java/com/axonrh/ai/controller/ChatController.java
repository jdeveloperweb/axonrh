package com.axonrh.ai.controller;

import com.axonrh.ai.dto.ChatResponse;
import com.axonrh.ai.dto.StreamChunk;
import com.axonrh.ai.entity.Conversation;
import com.axonrh.ai.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ConversationService conversationService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody ChatRequest request) {

        ChatResponse response = conversationService.chat(
                request.getConversationId(),
                request.getMessage(),
                tenantId,
                userId
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<StreamChunk>> streamChat(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody ChatRequest request) {

        return conversationService.streamChat(
                request.getConversationId(),
                request.getMessage(),
                tenantId,
                userId
        ).map(chunk -> ServerSentEvent.<StreamChunk>builder()
                .data(chunk)
                .build());
    }

    @PostMapping("/conversations")
    public ResponseEntity<Conversation> createConversation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody(required = false) ConversationCreateRequest request) {

        Conversation.ConversationContext context = null;
        if (request != null) {
            context = Conversation.ConversationContext.builder()
                    .companyName(request.getCompanyName())
                    .userName(request.getUserName())
                    .userRole(request.getUserRole())
                    .department(request.getDepartment())
                    .permissions(request.getPermissions())
                    .build();
        }

        Conversation conversation = conversationService.createConversation(tenantId, userId, context);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/conversations")
    public ResponseEntity<Page<Conversation>> listConversations(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            Pageable pageable) {

        Page<Conversation> conversations = conversationService.listConversations(tenantId, userId, pageable);
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<Conversation> getConversation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable String id) {

        return conversationService.getConversation(id, tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/conversations/{id}/archive")
    public ResponseEntity<Void> archiveConversation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable String id) {

        conversationService.archiveConversation(id, tenantId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable String id) {

        conversationService.deleteConversation(id, tenantId);
        return ResponseEntity.ok().build();
    }

    @lombok.Data
    public static class ChatRequest {
        private String conversationId;
        private String message;
    }

    @lombok.Data
    public static class ConversationCreateRequest {
        private String companyName;
        private String userName;
        private String userRole;
        private String department;
        private java.util.List<String> permissions;
    }
}
