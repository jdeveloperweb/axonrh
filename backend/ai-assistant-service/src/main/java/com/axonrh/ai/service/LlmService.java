package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
import com.axonrh.ai.dto.ChatResponse;
import com.axonrh.ai.dto.StreamChunk;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theokanning.openai.completion.chat.ChatCompletionChunk;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.service.OpenAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LlmService {

    private final OpenAiService openAiService;
    private final WebClient anthropicWebClient;
    private final WebClient openAiWebClient;
    private final ObjectMapper objectMapper;

    @Value("${ai.openai.model:gpt-4-turbo-preview}")
    private String openAiModel;

    @Value("${ai.openai.max-tokens:4096}")
    private int openAiMaxTokens;

    @Value("${ai.openai.temperature:0.7}")
    private double openAiTemperature;

    @Value("${ai.anthropic.model:claude-3-sonnet-20240229}")
    private String anthropicModel;

    @Value("${ai.anthropic.max-tokens:4096}")
    private int anthropicMaxTokens;

    @Value("${ai.default-provider:openai}")
    private String defaultProvider;

    private void validateOpenAi() {
        if (openAiService == null) {
            throw new IllegalStateException("Serviço OpenAI não configurado. Verifique a chave da API (OPENAI_API_KEY).");
        }
    }

    public ChatResponse chat(ChatRequest request) {
        String provider = request.getProvider() != null ? request.getProvider() : defaultProvider;

        return switch (provider.toLowerCase()) {
            case "openai" -> {
                validateOpenAi();
                yield chatWithOpenAi(request);
            }
            case "anthropic" -> chatWithAnthropic(request);
            default -> {
                validateOpenAi();
                yield chatWithOpenAi(request);
            }
        };
    }

    public Flux<StreamChunk> streamChat(ChatRequest request) {
        String provider = request.getProvider() != null ? request.getProvider() : defaultProvider;

        return switch (provider.toLowerCase()) {
            case "openai" -> {
                validateOpenAi();
                yield streamOpenAi(request);
            }
            case "anthropic" -> streamAnthropic(request);
            default -> {
                validateOpenAi();
                yield streamOpenAi(request);
            }
        };
    }

    private ChatResponse chatWithOpenAi(ChatRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            List<com.theokanning.openai.completion.chat.ChatMessage> messages = request.getMessages().stream()
                    .map(m -> new com.theokanning.openai.completion.chat.ChatMessage(
                            m.getRole().name().toLowerCase(), m.getContent()))
                    .collect(Collectors.toList());

            ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
                    .model(request.getModel() != null ? request.getModel() : openAiModel)
                    .messages(messages)
                    .maxTokens(request.getMaxTokens() != null ? request.getMaxTokens() : openAiMaxTokens)
                    .temperature(request.getTemperature() != null ? request.getTemperature() : openAiTemperature)
                    .build();

            var completion = openAiService.createChatCompletion(completionRequest);
            var choice = completion.getChoices().get(0);

            return ChatResponse.builder()
                    .id(UUID.randomUUID().toString())
                    .content(choice.getMessage().getContent())
                    .role(ChatMessage.Role.ASSISTANT)
                    .provider("openai")
                    .model(completion.getModel())
                    .finishReason(choice.getFinishReason())
                    .usage(buildOpenAiUsage(completion.getUsage()))
                    .responseTimeMs(System.currentTimeMillis() - startTime)
                    .timestamp(Instant.now())
                    .build();
        } catch (Exception e) {
            log.error("Erro no chat OpenAI: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao obter resposta da OpenAI. Por favor, verifique as configurações ou tente novamente mais tarde.", e);
        }
    }

    private ChatResponse chatWithAnthropic(ChatRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            List<Map<String, String>> messages = new ArrayList<>();
            String systemPrompt = null;

            for (ChatMessage msg : request.getMessages()) {
                if (msg.getRole() == ChatMessage.Role.SYSTEM) {
                    systemPrompt = msg.getContent();
                } else {
                    messages.add(Map.of(
                            "role", msg.getRole().name().toLowerCase(),
                            "content", msg.getContent()
                    ));
                }
            }

            Map<String, Object> body = new java.util.HashMap<>();
            body.put("model", request.getModel() != null ? request.getModel() : anthropicModel);
            body.put("max_tokens", request.getMaxTokens() != null ? request.getMaxTokens() : anthropicMaxTokens);
            body.put("messages", messages);
            if (systemPrompt != null) {
                body.put("system", systemPrompt);
            }

            JsonNode response = anthropicWebClient.post()
                    .uri("/messages")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            String content = response.get("content").get(0).get("text").asText();
            JsonNode usage = response.get("usage");

            return ChatResponse.builder()
                    .id(response.get("id").asText())
                    .content(content)
                    .role(ChatMessage.Role.ASSISTANT)
                    .provider("anthropic")
                    .model(response.get("model").asText())
                    .finishReason(response.get("stop_reason").asText())
                    .usage(ChatResponse.Usage.builder()
                            .promptTokens(usage.get("input_tokens").asInt())
                            .completionTokens(usage.get("output_tokens").asInt())
                            .totalTokens(usage.get("input_tokens").asInt() + usage.get("output_tokens").asInt())
                            .build())
                    .responseTimeMs(System.currentTimeMillis() - startTime)
                    .timestamp(Instant.now())
                    .build();
        } catch (Exception e) {
            log.error("Anthropic chat error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get response from Anthropic", e);
        }
    }

    private ChatResponse.Usage buildOpenAiUsage(Object usage) {
        ChatResponse.Usage.UsageBuilder builder = ChatResponse.Usage.builder();
        if (usage == null) {
            return builder.build();
        }

        if (usage instanceof Number number) {
            return builder.totalTokens(Math.toIntExact(number.longValue())).build();
        }

        Integer promptTokens = readUsageToken(usage, "getPromptTokens");
        Integer completionTokens = readUsageToken(usage, "getCompletionTokens");
        Integer totalTokens = readUsageToken(usage, "getTotalTokens");

        if (promptTokens != null) {
            builder.promptTokens(promptTokens);
        }
        if (completionTokens != null) {
            builder.completionTokens(completionTokens);
        }
        if (totalTokens != null) {
            builder.totalTokens(totalTokens);
        }

        return builder.build();
    }

    private Integer readUsageToken(Object usage, String methodName) {
        try {
            Method method = usage.getClass().getMethod(methodName);
            Object value = method.invoke(usage);
            if (value instanceof Number number) {
                return Math.toIntExact(number.longValue());
            }
        } catch (ReflectiveOperationException e) {
            log.debug("OpenAI usage token lookup failed for {}: {}", methodName, e.getMessage());
        }
        return null;
    }

    private Flux<StreamChunk> streamOpenAi(ChatRequest request) {
        List<com.theokanning.openai.completion.chat.ChatMessage> messages = request.getMessages().stream()
                .map(m -> new com.theokanning.openai.completion.chat.ChatMessage(
                        m.getRole().name().toLowerCase(), m.getContent()))
                .collect(Collectors.toList());

        ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
                .model(request.getModel() != null ? request.getModel() : openAiModel)
                .messages(messages)
                .maxTokens(request.getMaxTokens() != null ? request.getMaxTokens() : openAiMaxTokens)
                .temperature(request.getTemperature() != null ? request.getTemperature() : openAiTemperature)
                .stream(true)
                .build();

        return Flux.create(sink -> {
            try {
                openAiService.streamChatCompletion(completionRequest)
                        .doOnError(e -> {
                            log.error("OpenAI stream error: {}", e.getMessage());
                            sink.error(e);
                        })
                        .blockingForEach(chunk -> {
                            if (chunk.getChoices() != null && !chunk.getChoices().isEmpty()) {
                                var delta = chunk.getChoices().get(0).getMessage();
                                if (delta != null && delta.getContent() != null) {
                                    sink.next(StreamChunk.builder()
                                            .content(delta.getContent())
                                            .done(false)
                                            .build());
                                }

                                String finishReason = chunk.getChoices().get(0).getFinishReason();
                                if (finishReason != null) {
                                    sink.next(StreamChunk.builder()
                                            .content("")
                                            .done(true)
                                            .finishReason(finishReason)
                                            .build());
                                }
                            }
                        });
                sink.complete();
            } catch (Exception e) {
                sink.error(e);
            }
        });
    }

    private Flux<StreamChunk> streamAnthropic(ChatRequest request) {
        List<Map<String, String>> messages = new ArrayList<>();
        String systemPrompt = null;

        for (ChatMessage msg : request.getMessages()) {
            if (msg.getRole() == ChatMessage.Role.SYSTEM) {
                systemPrompt = msg.getContent();
            } else {
                messages.add(Map.of(
                        "role", msg.getRole().name().toLowerCase(),
                        "content", msg.getContent()
                ));
            }
        }

        Map<String, Object> body = new java.util.HashMap<>();
        body.put("model", request.getModel() != null ? request.getModel() : anthropicModel);
        body.put("max_tokens", request.getMaxTokens() != null ? request.getMaxTokens() : anthropicMaxTokens);
        body.put("messages", messages);
        body.put("stream", true);
        if (systemPrompt != null) {
            body.put("system", systemPrompt);
        }

        return anthropicWebClient.post()
                .uri("/messages")
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .filter(line -> line.startsWith("data: "))
                .map(line -> line.substring(6))
                .filter(data -> !data.equals("[DONE]"))
                .flatMap(data -> {
                    try {
                        JsonNode json = objectMapper.readTree(data);
                        String type = json.get("type").asText();

                        if ("content_block_delta".equals(type)) {
                            String text = json.get("delta").get("text").asText();
                            return Mono.just(StreamChunk.builder()
                                    .content(text)
                                    .done(false)
                                    .build());
                        } else if ("message_stop".equals(type)) {
                            return Mono.just(StreamChunk.builder()
                                    .content("")
                                    .done(true)
                                    .finishReason("end_turn")
                                    .build());
                        }
                        return Mono.empty();
                    } catch (Exception e) {
                        return Mono.error(e);
                    }
                });
    }

    public List<Float> generateEmbedding(String text) {
        try {
            var embeddingRequest = com.theokanning.openai.embedding.EmbeddingRequest.builder()
                    .model("text-embedding-3-small")
                    .input(List.of(text))
                    .build();

            var result = openAiService.createEmbeddings(embeddingRequest);
            return result.getData().get(0).getEmbedding().stream()
                    .map(Double::floatValue)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error generating embedding: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate embedding", e);
        }
    }

    public List<List<Float>> generateEmbeddings(List<String> texts) {
        try {
            var embeddingRequest = com.theokanning.openai.embedding.EmbeddingRequest.builder()
                    .model("text-embedding-3-small")
                    .input(texts)
                    .build();

            var result = openAiService.createEmbeddings(embeddingRequest);
            return result.getData().stream()
                    .map(e -> e.getEmbedding().stream()
                            .map(Double::floatValue)
                            .collect(Collectors.toList()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error generating embeddings: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate embeddings", e);
        }
    }
}
