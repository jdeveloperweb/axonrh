package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
import com.axonrh.ai.dto.ChatResponse;
import com.axonrh.ai.dto.StreamChunk;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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

    public ChatResponse chat(ChatRequest request) {
        String provider = request.getProvider() != null ? request.getProvider() : defaultProvider;

        return switch (provider.toLowerCase()) {
            case "openai" -> chatWithOpenAi(request);
            case "anthropic" -> chatWithAnthropic(request);
            default -> chatWithOpenAi(request);
        };
    }

    public Flux<StreamChunk> streamChat(ChatRequest request) {
        String provider = request.getProvider() != null ? request.getProvider() : defaultProvider;

        return switch (provider.toLowerCase()) {
            case "openai" -> streamOpenAi(request);
            case "anthropic" -> streamAnthropic(request);
            default -> streamOpenAi(request);
        };
    }

    private ChatResponse chatWithOpenAi(ChatRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            Map<String, Object> body = buildOpenAiBody(request, false);

            JsonNode response = openAiWebClient.post()
                    .uri("/chat/completions")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            JsonNode choice = response.get("choices").get(0);
            JsonNode message = choice.get("message");
            JsonNode usage = response.get("usage");

            return ChatResponse.builder()
                    .id(response.get("id").asText())
                    .content(message.get("content").asText())
                    .role(ChatMessage.Role.ASSISTANT)
                    .provider("openai")
                    .model(response.get("model").asText())
                    .finishReason(choice.get("finish_reason").asText())
                    .usage(ChatResponse.Usage.builder()
                            .promptTokens(usage.get("prompt_tokens").asInt())
                            .completionTokens(usage.get("completion_tokens").asInt())
                            .totalTokens(usage.get("total_tokens").asInt())
                            .build())
                    .responseTimeMs(System.currentTimeMillis() - startTime)
                    .timestamp(Instant.now())
                    .build();
        } catch (Exception e) {
            log.error("Erro crítico na comunicação com OpenAI Chat ({}): {}", openAiModel, e.getMessage(), e);
            throw new RuntimeException("Falha ao obter resposta da OpenAI. Por favor, verifique se a API Key está configurada corretamente ou se há saldo na conta.", e);
        }
    }

    private ChatResponse chatWithAnthropic(ChatRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            Map<String, Object> body = buildAnthropicBody(request, false);

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

    private Flux<StreamChunk> streamOpenAi(ChatRequest request) {
        Map<String, Object> body = buildOpenAiBody(request, true);

        return openAiWebClient.post()
                .uri("/chat/completions")
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .filter(line -> !line.isBlank() && !line.equals("[DONE]")) // Filter empty lines and DONE marker
                .flatMap(responseLine -> {
                    try {
                        // OpenAI sends raw JSON chunks if not using SSE wrapper properly in WebClient,
                        // but usually follows "data: " prefix convention in streams.
                        // Standard Spring WebClient might consume raw bytes.
                        // Let's handle generic JSON line first.
                        // BUT standard OpenAI stream format is "data: {...}"
                        
                        String jsonStr = responseLine;
                        // Some clients strip "data: " automatically, but raw string body flux might not.
                        // Usually webclient decoding to string will give the whole body? 
                        // Actually bodyToFlux(String.class) with JSON stream usually gives objects.
                        // Let's assume we get standard SSE lines here if use direct stream processing?
                        // No, let's play safe and parse what we get.
                        
                        // Simplest: use proper jackson decoding if possible, but stream structure is tricky.
                        // Let's rely on standard logic: 
                        // If it's a JSON object string, parse it.
                        
                       JsonNode json = objectMapper.readTree(jsonStr);
                       return Mono.just(json);
                    } catch (Exception e) {
                        // If it is "data: ..." format
                         if (responseLine.startsWith("data: ")) {
                             String data = responseLine.substring(6).trim();
                             if ("[DONE]".equals(data)) return Mono.empty();
                             try {
                                 return Mono.just(objectMapper.readTree(data));
                             } catch (Exception ex) {
                                 return Mono.error(ex);
                             }
                         }
                         return Mono.empty();
                    }
                })
                .map(chunk -> {
                     // Check valid chunk structure
                     if (chunk.has("choices") && !chunk.get("choices").isEmpty()) {
                         JsonNode choice = chunk.get("choices").get(0);
                         JsonNode delta = choice.get("delta");
                         String finishReason = choice.has("finish_reason") && !choice.get("finish_reason").isNull() 
                                 ? choice.get("finish_reason").asText() : null;

                         String content = delta.has("content") && !delta.get("content").isNull() 
                                 ? delta.get("content").asText() : null;
                         
                         if (content != null) {
                             return StreamChunk.builder().content(content).done(false).build();
                         }
                         if (finishReason != null) {
                             return StreamChunk.builder().content("").done(true).finishReason(finishReason).build();
                         }
                     }
                     return StreamChunk.builder().content("").done(false).build(); // Keep-alive or empty
                })
                .filter(chunk -> (chunk.getContent() != null && !chunk.getContent().isEmpty()) || chunk.isDone());
    }

    private Flux<StreamChunk> streamAnthropic(ChatRequest request) {
        Map<String, Object> body = buildAnthropicBody(request, true);

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
        return generateEmbeddings(List.of(text)).get(0);
    }

    public List<List<Float>> generateEmbeddings(List<String> texts) {
        try {
            Map<String, Object> body = Map.of(
                    "input", texts,
                    "model", "text-embedding-3-small"
            );

            JsonNode response = openAiWebClient.post()
                    .uri("/embeddings")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            List<List<Float>> embeddings = new ArrayList<>();
            if (response.has("data")) {
                for (JsonNode item : response.get("data")) {
                    List<Float> vector = new ArrayList<>();
                    for (JsonNode val : item.get("embedding")) {
                        vector.add(val.floatValue());
                    }
                    embeddings.add(vector);
                }
            }
            return embeddings;

        } catch (Exception e) {
            log.error("Error generating embeddings: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate embeddings", e);
        }
    }

    private Map<String, Object> buildOpenAiBody(ChatRequest request, boolean stream) {
        List<Map<String, String>> messages = request.getMessages().stream()
                .map(m -> Map.of(
                        "role", m.getRole().name().toLowerCase(),
                        "content", m.getContent()))
                .collect(Collectors.toList());

        Map<String, Object> body = new java.util.HashMap<>();
        body.put("model", request.getModel() != null ? request.getModel() : openAiModel);
        body.put("messages", messages);
        body.put("max_tokens", request.getMaxTokens() != null ? request.getMaxTokens() : openAiMaxTokens);
        body.put("temperature", request.getTemperature() != null ? request.getTemperature() : openAiTemperature);
        body.put("stream", stream);
        return body;
    }

    private Map<String, Object> buildAnthropicBody(ChatRequest request, boolean stream) {
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
        if (stream) {
            body.put("stream", true);
        }
        if (systemPrompt != null) {
            body.put("system", systemPrompt);
        }
        return body;
    }
}
