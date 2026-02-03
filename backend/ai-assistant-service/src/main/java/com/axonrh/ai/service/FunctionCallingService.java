package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
import com.axonrh.ai.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service that orchestrates the Function Calling flow with OpenAI.
 *
 * The flow is:
 * 1. Send user message + tools to LLM
 * 2. If LLM returns tool_calls, execute them and send results back
 * 3. Repeat until LLM returns a final response (no tool_calls)
 *
 * This replaces the manual NLU-based intent routing with LLM-driven tool selection.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FunctionCallingService {

    private final LlmService llmService;
    private final ToolDefinitionService toolDefinitionService;
    private final ToolExecutorService toolExecutorService;

    @Value("${ai.function-calling.max-iterations:5}")
    private int maxIterations;

    @Value("${ai.function-calling.enabled:true}")
    private boolean functionCallingEnabled;

    /**
     * Processes a chat request with function calling support.
     * Returns the final response after executing any necessary tool calls.
     */
    public FunctionCallingResult chat(List<ChatMessage> messages, UUID tenantId, UUID userId) {
        if (!functionCallingEnabled) {
            log.debug("Function calling disabled, using direct LLM chat");
            return directChat(messages);
        }

        List<ChatMessage> conversationHistory = new ArrayList<>(messages);
        List<ChatRequest.Tool> tools = toolDefinitionService.getAllTools();
        ToolExecutorService.ExecutionContext context = new ToolExecutorService.ExecutionContext(
                tenantId, userId, List.of());

        int iterations = 0;
        ChatResponse response;
        List<ToolExecutionRecord> toolExecutions = new ArrayList<>();

        while (iterations < maxIterations) {
            iterations++;
            log.debug("Function calling iteration {} of {}", iterations, maxIterations);

            // Build and send request
            ChatRequest request = ChatRequest.builder()
                    .messages(conversationHistory)
                    .tools(tools)
                    .build();

            response = llmService.chat(request);

            // Check if LLM wants to call tools
            if (response.getToolCalls() == null || response.getToolCalls().isEmpty()) {
                // No tool calls - this is the final response
                log.info("LLM returned final response after {} iteration(s)", iterations);
                return new FunctionCallingResult(
                        response.getContent(),
                        toolExecutions,
                        iterations,
                        response.getUsage()
                );
            }

            // LLM wants to call tools
            log.info("LLM requested {} tool call(s) in iteration {}",
                    response.getToolCalls().size(), iterations);

            // Add assistant message with tool calls to history
            ChatMessage assistantMessage = ChatMessage.builder()
                    .role(ChatMessage.Role.ASSISTANT)
                    .content(response.getContent())
                    .toolCalls(response.getToolCalls())
                    .build();
            conversationHistory.add(assistantMessage);

            // Execute tool calls
            List<ToolExecutorService.ToolResult> results = toolExecutorService.executeToolCalls(
                    response.getToolCalls(), context);

            // Add tool results to history and record executions
            for (ToolExecutorService.ToolResult result : results) {
                ChatMessage toolMessage = ChatMessage.builder()
                        .role(ChatMessage.Role.TOOL)
                        .content(result.result())
                        .toolCallId(result.toolCallId())
                        .build();
                conversationHistory.add(toolMessage);

                toolExecutions.add(new ToolExecutionRecord(
                        result.functionName(),
                        result.result(),
                        result.success()
                ));
            }
        }

        // Max iterations reached - return whatever we have
        log.warn("Max iterations ({}) reached in function calling loop", maxIterations);
        return new FunctionCallingResult(
                "Desculpe, não foi possível completar a operação. Por favor, tente novamente com uma pergunta mais específica.",
                toolExecutions,
                iterations,
                null
        );
    }

    /**
     * Direct chat without function calling.
     */
    private FunctionCallingResult directChat(List<ChatMessage> messages) {
        ChatRequest request = ChatRequest.builder()
                .messages(messages)
                .build();

        ChatResponse response = llmService.chat(request);

        return new FunctionCallingResult(
                response.getContent(),
                List.of(),
                1,
                response.getUsage()
        );
    }

    /**
     * Result of function calling flow.
     */
    public record FunctionCallingResult(
            String content,
            List<ToolExecutionRecord> toolExecutions,
            int iterations,
            ChatResponse.Usage usage
    ) {
        public boolean usedTools() {
            return !toolExecutions.isEmpty();
        }
    }

    /**
     * Record of a tool execution.
     */
    public record ToolExecutionRecord(
            String toolName,
            String result,
            boolean success
    ) {}
}
