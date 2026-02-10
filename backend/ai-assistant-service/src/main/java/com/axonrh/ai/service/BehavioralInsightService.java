package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
import com.axonrh.ai.dto.ChatResponse;
import com.axonrh.ai.dto.DiscInsightRequest;
import com.axonrh.ai.entity.AiPrompt;
import com.axonrh.ai.repository.AiPromptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BehavioralInsightService {

    private final LlmService llmService;
    private final AiPromptRepository promptRepository;

    private static final String DEFAULT_PROMPT = "Você é a AxonIA, uma assistente de RH especialista em análise comportamental DISC. " +
            "Sua tarefa é fornecer uma dica curta, motivadora e prática (daily tip) para o colaborador baseada no seu perfil DISC. " +
            "Se o perfil não estiver disponível, dê uma dica de produtividade ou bem-estar geral. " +
            "Responda SEMPRE em português do Brasil, de forma amigável e profissional. " +
            "A dica deve ter no máximo 2 frases e ser estratégica para o dia de trabalho.";

    public String generateDiscInsight(UUID tenantId, DiscInsightRequest request) {
        try {
            String systemPrompt = promptRepository.findByNameWithSystem(tenantId, "disc_insight_system")
                    .stream()
                    .findFirst()
                    .map(AiPrompt::getPromptTemplate)
                    .orElse(DEFAULT_PROMPT);

            StringBuilder userMessage = new StringBuilder();
            if (request.getPrimaryProfile() != null) {
                userMessage.append("Colaborador: ").append(request.getEmployeeName()).append("\n");
                userMessage.append("Perfil Primário: ").append(request.getPrimaryProfile()).append("\n");
                if (request.getSecondaryProfile() != null) {
                    userMessage.append("Perfil Secundário: ").append(request.getSecondaryProfile()).append("\n");
                }
                userMessage.append("Scores: D=").append(request.getDScore())
                        .append(", I=").append(request.getIScore())
                        .append(", S=").append(request.getSScore())
                        .append(", C=").append(request.getCScore()).append("\n");
                userMessage.append("Gere uma dica estratégica baseada nesse perfil.");
            } else {
                userMessage.append("Colaborador: ").append(request.getEmployeeName()).append("\n");
                userMessage.append("Perfil DISC não disponível. Gere uma dica de produtividade ou bem-estar focada no trabalho.");
            }

            ChatRequest chatRequest = ChatRequest.builder()
                    .messages(List.of(
                            ChatMessage.builder().role(ChatMessage.Role.SYSTEM).content(systemPrompt).build(),
                            ChatMessage.builder().role(ChatMessage.Role.USER).content(userMessage.toString()).build()
                    ))
                    .temperature(0.7)
                    .maxTokens(200)
                    .build();

            ChatResponse response = llmService.chat(chatRequest);
            return response.getContent() != null ? response.getContent().trim() : getDefaultGenericTip();
        } catch (Exception e) {
            log.error("Error generating AI behavioral insight for tenant {}: {}", tenantId, e.getMessage());
            return getDefaultGenericTip();
        }
    }

    private String getDefaultGenericTip() {
        return "Organize suas tarefas por prioridade hoje. Começar pelo mais complexo ajuda a manter a produtividade alta durante todo o dia.";
    }
}
