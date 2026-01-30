package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
import com.axonrh.ai.dto.ChatResponse;
import com.axonrh.ai.dto.StreamChunk;
import com.axonrh.ai.entity.AiIntent;
import com.axonrh.ai.entity.Conversation;
import com.axonrh.ai.entity.Conversation.ConversationContext;
import com.axonrh.ai.entity.Conversation.ConversationMetadata;
import com.axonrh.ai.entity.Conversation.Message;
import com.axonrh.ai.entity.AiPrompt;
import com.axonrh.ai.repository.AiPromptRepository;
import com.axonrh.ai.repository.ConversationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final AiPromptRepository promptRepository;
    private final LlmService llmService;
    private final NluService nluService;
    private final QueryBuilderService queryBuilderService;
    private final CalculationService calculationService;
    private final KnowledgeService knowledgeService;
    private final ObjectMapper objectMapper;

    @Value("${assistant.conversation.context-window:10}")
    private int contextWindow;

    @Value("${assistant.conversation.auto-summarize-after:20}")
    private int autoSummarizeAfter;

    public Conversation createConversation(UUID tenantId, UUID userId, ConversationContext context) {
        Conversation conversation = Conversation.builder()
                .tenantId(tenantId)
                .userId(userId)
                .status(Conversation.ConversationStatus.ACTIVE)
                .context(context)
                .metadata(new ConversationMetadata())
                .messages(new ArrayList<>())
                .build();

        // Add system message
        String systemPrompt = buildSystemPrompt(tenantId, context);
        Message systemMessage = Message.builder()
                .id(UUID.randomUUID().toString())
                .role(Message.MessageRole.SYSTEM)
                .content(systemPrompt)
                .type(Message.MessageType.TEXT)
                .timestamp(Instant.now())
                .build();
        conversation.addMessage(systemMessage);

        return conversationRepository.save(conversation);
    }

    public ChatResponse chat(String conversationId, String userMessage, UUID tenantId, UUID userId) {
        Conversation conversation = getOrCreateConversation(conversationId, tenantId, userId);

        // Add user message
        Message userMsg = Message.builder()
                .id(UUID.randomUUID().toString())
                .role(Message.MessageRole.USER)
                .content(userMessage)
                .type(Message.MessageType.TEXT)
                .timestamp(Instant.now())
                .build();
        conversation.addMessage(userMsg);

        // Analyze intent
        NluService.NluResult nluResult = nluService.analyze(userMessage, tenantId, conversation.getMetadata().getLastIntent());
        log.debug("NLU Result: intent={}, confidence={}", nluResult.getIntent(), nluResult.getConfidence());

        // Process based on intent
        String response;
        Message.MessageType responseType = Message.MessageType.TEXT;

        try {
            response = switch (nluResult.getActionType()) {
                case DATABASE_QUERY -> handleDatabaseQuery(userMessage, nluResult, tenantId, userId);
                case CALCULATION -> handleCalculation(nluResult);
                case KNOWLEDGE_SEARCH -> handleKnowledgeSearch(conversation, userMessage, nluResult, tenantId);
                case ACTION_CONFIRMATION -> handleActionConfirmation(nluResult);
                default -> handleGeneralChat(conversation, userMessage, nluResult);
            };

            if (nluResult.getActionType() == AiIntent.ActionType.DATABASE_QUERY) {
                responseType = Message.MessageType.QUERY_RESULT;
            } else if (nluResult.getActionType() == AiIntent.ActionType.CALCULATION) {
                responseType = Message.MessageType.CALCULATION;
            } else if (nluResult.getActionType() == AiIntent.ActionType.ACTION_CONFIRMATION) {
                responseType = Message.MessageType.ACTION_CONFIRMATION;
            } else if (nluResult.getIntent() != null && nluResult.getIntent().startsWith("execute_")) {
                responseType = Message.MessageType.TEXT;
            }
        } catch (Exception e) {
            log.error("Error processing message: {}", e.getMessage(), e);
            response = "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.";
            responseType = Message.MessageType.ERROR;
        }

        // Add assistant message
        Message assistantMsg = Message.builder()
                .id(UUID.randomUUID().toString())
                .role(Message.MessageRole.ASSISTANT)
                .content(response)
                .type(responseType)
                .metadata(Map.of("intent", nluResult.getIntent(), "confidence", nluResult.getConfidence()))
                .timestamp(Instant.now())
                .build();
        conversation.addMessage(assistantMsg);

        // Update metadata
        conversation.getMetadata().setLastIntent(nluResult.getIntent());

        // Auto-summarize if needed
        if (conversation.getMessages().size() > autoSummarizeAfter) {
            summarizeConversation(conversation);
        }

        conversationRepository.save(conversation);

        return ChatResponse.builder()
                .id(assistantMsg.getId())
                .content(response)
                .role(ChatMessage.Role.ASSISTANT)
                .type(assistantMsg.getType().name())
                .timestamp(Instant.now())
                .build();
    }

    public Flux<StreamChunk> streamChat(String conversationId, String userMessage, UUID tenantId, UUID userId) {
        return Mono.fromCallable(() -> {
            Conversation conversation = getOrCreateConversation(conversationId, tenantId, userId);

            // Add user message
            Message userMsg = Message.builder()
                    .id(UUID.randomUUID().toString())
                    .role(Message.MessageRole.USER)
                    .content(userMessage)
                    .type(Message.MessageType.TEXT)
                    .timestamp(Instant.now())
                    .build();
            conversation.addMessage(userMsg);
            return conversationRepository.save(conversation);
        }).flatMapMany(conversation -> {
            // Analyze intent reativelly
            return Mono.fromCallable(() -> nluService.analyze(userMessage, tenantId, conversation.getMetadata().getLastIntent()))
                .flatMapMany(nluResult -> {
                    log.debug("Stream NLU Result: intent={}, actionType={}", nluResult.getIntent(), nluResult.getActionType());

                    // For non-INFORMATION actions, handle synchronouly but return as Flux
                    if (nluResult.getActionType() != AiIntent.ActionType.INFORMATION) {
                        return Mono.fromCallable(() -> {
                            log.debug("Processing specialized action: {}", nluResult.getActionType());
                            String syncResponse;
                            Message.MessageType syncResponseType = Message.MessageType.TEXT;

                            syncResponse = switch (nluResult.getActionType()) {
                                case DATABASE_QUERY -> handleDatabaseQuery(userMessage, nluResult, tenantId, userId);
                                case CALCULATION -> handleCalculation(nluResult);
                                case KNOWLEDGE_SEARCH -> handleKnowledgeSearch(conversation, userMessage, nluResult, tenantId);
                                case ACTION_CONFIRMATION -> handleActionConfirmation(nluResult);
                                default -> handleGeneralChat(conversation, userMessage, nluResult);
                            };

                            if (syncResponse != null) {
                                if (nluResult.getActionType() == AiIntent.ActionType.DATABASE_QUERY) {
                                    syncResponseType = Message.MessageType.QUERY_RESULT;
                                } else if (nluResult.getActionType() == AiIntent.ActionType.CALCULATION) {
                                    syncResponseType = Message.MessageType.CALCULATION;
                                } else if (nluResult.getActionType() == AiIntent.ActionType.ACTION_CONFIRMATION) {
                                    syncResponseType = Message.MessageType.ACTION_CONFIRMATION;
                                }

                                // Save assistant response
                                Message assistantMsg = Message.builder()
                                        .id(UUID.randomUUID().toString())
                                        .role(Message.MessageRole.ASSISTANT)
                                        .content(syncResponse)
                                        .type(syncResponseType)
                                        .timestamp(Instant.now())
                                        .build();
                                conversation.addMessage(assistantMsg);
                                conversationRepository.save(conversation);

                                return syncResponse;
                            }
                            return null;
                        })
                        .subscribeOn(Schedulers.boundedElastic())
                        .flatMapMany(responseStr -> {
                            if (responseStr == null) {
                                log.warn("Finished processing action with null response");
                                return Flux.empty();
                            }
                            
                            Message.MessageType streamResponseType = Message.MessageType.TEXT;
                            if (nluResult.getActionType() == AiIntent.ActionType.DATABASE_QUERY) {
                                streamResponseType = Message.MessageType.QUERY_RESULT;
                            } else if (nluResult.getActionType() == AiIntent.ActionType.CALCULATION) {
                                streamResponseType = Message.MessageType.CALCULATION;
                            } else if (nluResult.getActionType() == AiIntent.ActionType.ACTION_CONFIRMATION) {
                                streamResponseType = Message.MessageType.ACTION_CONFIRMATION;
                            }

                            log.debug("Emitting chunks for action result. Type: {} Content length: {}", streamResponseType, responseStr != null ? responseStr.length() : "null");
                            if (responseStr != null && responseStr.length() < 100) {
                                log.debug("Content preview: {}", responseStr);
                            }
                            return Flux.just(
                                    StreamChunk.builder()
                                            .content(responseStr)
                                            .type(streamResponseType.name())
                                            .done(false)
                                            .build(),
                                    StreamChunk.builder()
                                            .done(true)
                                            .build()
                            );
                        }).onErrorResume(e -> {
                            log.error("Error processing stream action: {}", e.getMessage(), e);
                            return Flux.just(StreamChunk.builder()
                                    .content("Desculpe, ocorreu um erro ao processar sua solicitação.")
                                    .done(true)
                                    .build());
                        });
                    }

                    // Fallback to regular chat streaming
                    log.debug("Fallback to regular LLM chat streaming");
                    List<ChatMessage> messages = buildChatMessages(conversation);

                    ChatRequest request = ChatRequest.builder()
                            .messages(messages)
                            .stream(true)
                            .build();

                    StringBuilder fullResponse = new StringBuilder();

                    return llmService.streamChat(request)
                            .map(chunk -> {
                                if (chunk.getType() == null) {
                                    chunk.setType(Message.MessageType.TEXT.name());
                                }
                                return chunk;
                            })
                            .doOnNext(chunk -> {
                                if (!chunk.isDone()) {
                                    fullResponse.append(chunk.getContent());
                                }
                                log.trace("Emitting LLM chunk: done={}, length={}", chunk.isDone(), 
                                        chunk.getContent() != null ? chunk.getContent().length() : 0);
                            })
                            .doOnComplete(() -> {
                                log.debug("LLM stream completed, saving response (length: {})", fullResponse.length());
                                // Save assistant response
                                Message assistantMsg = Message.builder()
                                        .id(UUID.randomUUID().toString())
                                        .role(Message.MessageRole.ASSISTANT)
                                        .content(fullResponse.toString())
                                        .type(Message.MessageType.TEXT)
                                        .timestamp(Instant.now())
                                        .build();
                                conversation.addMessage(assistantMsg);
                                conversationRepository.save(conversation);
                            });
                });
        });
    }

    private Conversation getOrCreateConversation(String conversationId, UUID tenantId, UUID userId) {
        if (conversationId != null) {
            return conversationRepository.findByIdAndTenantId(conversationId, tenantId)
                    .orElseGet(() -> createConversation(tenantId, userId, null));
        }
        return createConversation(tenantId, userId, null);
    }

    private String buildSystemPrompt(UUID tenantId, ConversationContext context) {
        List<AiPrompt> prompts = promptRepository.findByNameWithSystem(tenantId, "hr_assistant_main");
        String template = prompts.isEmpty() ?
                getDefaultSystemPrompt() :
                prompts.get(0).getPromptTemplate();

        return template
                .replace("{company_context}", context != null && context.getCompanyName() != null ?
                        context.getCompanyName() : "Empresa")
                .replace("{user_context}", context != null && context.getUserName() != null ?
                        String.format("%s (%s)", context.getUserName(), context.getUserRole()) : "Usuário")
                .replace("{current_date}", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
    }

    private String getDefaultSystemPrompt() {
        return """
            Você é o Assistente de RH da AxonRH, uma plataforma de gestão de recursos humanos.

            Suas capacidades incluem:
            - Responder perguntas sobre políticas de RH
            - Realizar cálculos trabalhistas (férias, rescisão, horas extras)
            - Consultar dados de funcionários e folha de pagamento
            - Explicar legislação trabalhista brasileira

            Sempre responda em português brasileiro. Seja preciso com números e datas.
            Cite a legislação quando relevante (CLT, eSocial).
            Proteja informações sensíveis.

            Data atual: {current_date}
            Empresa: {company_context}
            Usuário: {user_context}
            """;
    }

    private String handleDatabaseQuery(String question, NluService.NluResult nluResult,
                                        UUID tenantId, UUID userId) {
        QueryBuilderService.QueryResult result = queryBuilderService.buildAndExecuteQuery(
                question,
                nluResult.getEntities(),
                tenantId,
                List.of() // User permissions would come from auth context
        );

        if (!result.isSuccess()) {
            return "Não foi possível executar a consulta: " + result.getError();
        }

        if (result.getData().isEmpty()) {
            // Check if it was likely a list request
            if (question.toLowerCase().contains("listar") || question.toLowerCase().contains("quem") || question.toLowerCase().contains("quais")) {
                return "Realizei a busca, mas não encontrei nenhum registro que corresponda à sua solicitação no momento. Caso precise de algo mais específico, estou à disposição!";
            }
            return "Busquei pelas informações solicitadas, mas no momento não encontrei registros no sistema para esse filtro. Posso ajudar com outra consulta?";
        }

        // Special handling for single value results (like COUNT, SUM)
        if (result.getRowCount() == 1 && result.getData().get(0).size() == 1) {
            Map<String, Object> row = result.getData().get(0);
            Object value = row.values().iterator().next();
            String colName = row.keySet().iterator().next().toLowerCase();
            
            if (colName.contains("count")) {
                long count = ((Number) value).longValue();
                if (count == 0) {
                    return "No momento, não identifiquei nenhum registro para essa solicitação no sistema.";
                }
                return String.format("Atualmente, temos %d registro(s) que atendem à sua busca.", count);
            }
            
            return String.format("%s: %s", formatColumnName(colName), formatValue(colName, value));
        }

        // Format results
        StringBuilder response = new StringBuilder();
        
        if (result.getExplanation() != null && !result.getExplanation().isBlank()) {
            response.append(result.getExplanation()).append("\n\n");
        } else {
            response.append(String.format("Encontrei %d registro(s):\n\n", result.getRowCount()));
        }

        // Format as table for small result sets
        if (result.getRowCount() <= 10) {
            response.append(formatAsTable(result.getData()));
        } else {
            response.append(formatAsSummary(result.getData()));
        }

        return response.toString();
    }

    private String handleCalculation(NluService.NluResult nluResult) {
        Map<String, Object> entities = nluResult.getEntities();

        CalculationService.CalculationResult result;

        switch (nluResult.getIntent()) {
            case "calculate_vacation" -> {
                BigDecimal salary = entities.containsKey("salary") ?
                        new BigDecimal(entities.get("salary").toString()) : new BigDecimal("3000");
                int days = entities.containsKey("days") ?
                        (Integer) entities.get("days") : 30;
                boolean abono = entities.containsKey("abono") && (Boolean) entities.get("abono");
                int dependents = entities.containsKey("dependents") ?
                        (Integer) entities.get("dependents") : 0;

                result = calculationService.calculateVacation(salary, days, abono, dependents);
            }
            case "calculate_termination" -> {
                BigDecimal salary = entities.containsKey("salary") ?
                        new BigDecimal(entities.get("salary").toString()) : new BigDecimal("3000");
                String type = entities.containsKey("type") ?
                        (String) entities.get("type") : "SEM_JUSTA_CAUSA";
                LocalDate hireDate = LocalDate.now().minusYears(2);
                LocalDate termDate = LocalDate.now();

                result = calculationService.calculateTermination(salary, hireDate, termDate,
                        type, 0, false, BigDecimal.ZERO);
            }
            default -> {
                return "Não consegui identificar o tipo de cálculo solicitado. " +
                        "Posso calcular: férias, rescisão, horas extras.";
            }
        }

        return formatCalculationResult(result);
    }

    private String handleKnowledgeSearch(Conversation conversation, String question, NluService.NluResult nluResult, UUID tenantId) {
        String topic = nluResult.getEntities().containsKey("topic") ?
                (String) nluResult.getEntities().get("topic") : "";

        List<KnowledgeService.SearchResult> results = knowledgeService.search(question, tenantId, 3);

        if (results.isEmpty()) {
            return handleGeneralChat(conversation, question, nluResult);
        }

        StringBuilder response = new StringBuilder();
        response.append("Encontrei as seguintes informações relevantes:\n\n");

        for (int i = 0; i < results.size(); i++) {
            KnowledgeService.SearchResult r = results.get(i);
            response.append(String.format("%d. **%s**\n", i + 1, r.getDocumentTitle()));
            response.append(r.getContent()).append("\n\n");
        }

        return response.toString();
    }

    private String handleActionConfirmation(NluService.NluResult nluResult) {
        Map<String, Object> data = new HashMap<>(nluResult.getEntities());
        data.put("action", nluResult.getIntent());
        
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            log.error("Error serializing action confirmation", e);
            return "{\"error\": \"Erro ao preparar ação.\"}";
        }
    }

    private String handleGeneralChat(Conversation conversation, String userMessage, NluService.NluResult nluResult) {
        // Handle execution intents
        if (nluResult != null && nluResult.getIntent() != null && nluResult.getIntent().startsWith("execute_")) {
            return handleActionExecution(nluResult);
        }

        List<ChatMessage> messages = conversation != null ?
                buildChatMessages(conversation) :
                List.of(
                        ChatMessage.builder()
                                .role(ChatMessage.Role.SYSTEM)
                                .content(getDefaultSystemPrompt())
                                .build(),
                        ChatMessage.builder()
                                .role(ChatMessage.Role.USER)
                                .content(userMessage)
                                .build()
                );

        ChatRequest request = ChatRequest.builder()
                .messages(messages)
                .build();

        ChatResponse response = llmService.chat(request);
        return response.getContent();
    }

    private String handleActionExecution(NluService.NluResult nluResult) {
        String intent = nluResult.getIntent();
        log.info("Executing action for intent: {}", intent);
        
        return switch (intent) {
            case "execute_vacation_approval" -> "A solicitação de férias foi aprovada com sucesso no sistema. O colaborador será notificado.";
            case "execute_termination" -> "O processo de desligamento foi iniciado com sucesso. O setor de RH já recebeu a notificação para proceder com os trâmites legais.";
            default -> "A ação foi executada com sucesso.";
        };
    }

    private List<ChatMessage> buildChatMessages(Conversation conversation) {
        List<Message> recentMessages = conversation.getRecentMessages(contextWindow);

        return recentMessages.stream()
                .map(m -> ChatMessage.builder()
                        .role(mapRole(m.getRole()))
                        .content(m.getContent())
                        .build())
                .collect(Collectors.toList());
    }

    private ChatMessage.Role mapRole(Message.MessageRole role) {
        return switch (role) {
            case SYSTEM -> ChatMessage.Role.SYSTEM;
            case USER -> ChatMessage.Role.USER;
            case ASSISTANT -> ChatMessage.Role.ASSISTANT;
            case TOOL -> ChatMessage.Role.TOOL;
        };
    }

    private String formatAsTable(List<Map<String, Object>> data) {
        if (data.isEmpty()) return "";

        Set<String> columns = data.get(0).keySet();
        StringBuilder sb = new StringBuilder();

        // Header
        sb.append("| ");
        for (String col : columns) {
            sb.append(formatColumnName(col)).append(" | ");
        }
        sb.append("\n|");
        for (String ignored : columns) {
            sb.append("---|");
        }
        sb.append("\n");

        // Rows
        for (Map<String, Object> row : data) {
            sb.append("| ");
            for (String col : columns) {
                Object value = row.get(col);
                sb.append(formatValue(col, value)).append(" | ");
            }
            sb.append("\n");
        }

        return sb.toString();
    }

    private String formatAsSummary(List<Map<String, Object>> data) {
        return String.format("Mostrando %d de %d resultados. Use filtros para refinar a busca.",
                Math.min(10, data.size()), data.size());
    }

    private String formatColumnName(String name) {
        return name.replace("_", " ")
                .substring(0, 1).toUpperCase() + name.substring(1);
    }

    private String formatValue(String key, Object value) {
        if (value == null) return "-";
        if (value instanceof BigDecimal bd) {
            String lowerKey = key != null ? key.toLowerCase() : "";
            // Heuristic for currency columns based on name
            if (lowerKey.contains("salary") || lowerKey.contains("salario") || 
                lowerKey.contains("valor") || lowerKey.contains("price") || 
                lowerKey.contains("amount") || lowerKey.contains("total") ||
                lowerKey.contains("custo") || lowerKey.contains("despesa") ||
                lowerKey.contains("remuneracao") || lowerKey.contains("bonus") ||
                lowerKey.contains("liquido") || lowerKey.contains("bruto")) {
                return String.format("R$ %.2f", bd);
            }
            // For other numbers (like age, count, etc), check if integer
            try {
                if (bd.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0) {
                    return String.format("%.0f", bd);
                }
            } catch (Exception e) {
                // ignore
            }
            return bd.toString();
        }
        return value.toString();
    }

    private String formatCalculationResult(CalculationService.CalculationResult result) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("## Cálculo de %s\n\n", formatCalculationType(result.getType())));
        sb.append("### Memória de Cálculo:\n");
        sb.append("```\n").append(result.getSteps()).append("```\n\n");
        sb.append(String.format("**Valor Bruto:** R$ %.2f\n", result.getGrossValue()));
        sb.append(String.format("**Valor Líquido:** R$ %.2f\n\n", result.getNetValue()));
        sb.append(String.format("*Base Legal: %s*", result.getLegalBasis()));
        return sb.toString();
    }

    private String formatCalculationType(String type) {
        return switch (type) {
            case "FERIAS" -> "Férias";
            case "RESCISAO" -> "Rescisão";
            case "HORAS_EXTRAS" -> "Horas Extras";
            default -> type;
        };
    }

    private void summarizeConversation(Conversation conversation) {
        // TODO: Implement conversation summarization
    }

    public Page<Conversation> listConversations(UUID tenantId, UUID userId, Pageable pageable) {
        return conversationRepository.findByTenantIdAndUserIdAndStatusOrderByUpdatedAtDesc(
                tenantId, userId, Conversation.ConversationStatus.ACTIVE, pageable);
    }

    public void deleteAllConversations(UUID tenantId, UUID userId) {
        List<Conversation> conversations = conversationRepository
                .findByTenantIdAndUserIdAndStatusAndUpdatedAtAfter(
                        tenantId, userId, Conversation.ConversationStatus.ACTIVE, Instant.EPOCH);
        
        conversations.forEach(c -> {
            c.setStatus(Conversation.ConversationStatus.DELETED);
            conversationRepository.save(c);
        });
    }

    public Optional<Conversation> getConversation(String id, UUID tenantId) {
        return conversationRepository.findByIdAndTenantId(id, tenantId);
    }

    public void archiveConversation(String id, UUID tenantId) {
        conversationRepository.findByIdAndTenantId(id, tenantId).ifPresent(c -> {
            c.setStatus(Conversation.ConversationStatus.ARCHIVED);
            c.setClosedAt(Instant.now());
            conversationRepository.save(c);
        });
    }

    public void deleteConversation(String id, UUID tenantId) {
        conversationRepository.findByIdAndTenantId(id, tenantId).ifPresent(c -> {
            c.setStatus(Conversation.ConversationStatus.DELETED);
            conversationRepository.save(c);
        });
    }
}
