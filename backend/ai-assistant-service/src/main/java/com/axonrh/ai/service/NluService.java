package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
import com.axonrh.ai.entity.AiIntent;
import com.axonrh.ai.repository.AiIntentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.text.similarity.LevenshteinDistance;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NluService {

    private final AiIntentRepository intentRepository;
    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    private static final String NLU_SYSTEM_PROMPT = """
        Você é um classificador de intenções para um sistema de RH.

        Analise a mensagem do usuário e retorne um JSON com:
        1. "intent": a intenção identificada
        2. "confidence": confiança de 0 a 1
        3. "entities": entidades extraídas (nome, data, departamento, valor, etc.)
        4. "parameters": parâmetros para a ação

        Intenções disponíveis:
        {intents}

        Responda APENAS com o JSON, sem explicações.

        Exemplo de resposta:
        {
            "intent": "query_employee",
            "confidence": 0.92,
            "entities": {"department": "TI"},
            "parameters": {"filter_by": "department", "filter_value": "TI"}
        }
        """;

    public NluResult analyze(String userMessage, UUID tenantId, String lastIntent) {
        // Check for confirmation of previous action
        if (lastIntent != null && lastIntent.startsWith("propose_")) {
             String normalized = userMessage.toLowerCase().trim();
             if (containsAny(normalized, "sim", "confirmar", "aprovar", "pode ser", "ok", "confirmo")) {
                 String action = lastIntent.replace("propose_", "execute_");
                 return NluResult.builder()
                    .intent(action)
                    .confidence(0.99)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.INFORMATION) // We will handle execution in ConversationService and return info
                    .build();
             }
        }

        // First, try rule-based matching for common patterns
        NluResult ruleBasedResult = ruleBasedAnalysis(userMessage);
        if (ruleBasedResult != null && ruleBasedResult.getConfidence() > 0.85) {
            return ruleBasedResult;
        }

        // Fall back to LLM-based analysis
        return llmBasedAnalysis(userMessage, tenantId);
    }

    private NluResult ruleBasedAnalysis(String message) {
        String normalizedMessage = message.toLowerCase().trim();

        // Vacation calculations
        if (containsAny(normalizedMessage, "férias", "calcular férias", "valor das férias", "quanto vou receber de férias")) {
            Map<String, Object> entities = extractVacationEntities(message);
            return NluResult.builder()
                    .intent("calculate_vacation")
                    .confidence(0.90)
                    .entities(entities)
                    .actionType(AiIntent.ActionType.CALCULATION)
                    .build();
        }

        // Termination calculations
        if (containsAny(normalizedMessage, "rescisão", "demissão", "calcular rescisão", "verbas rescisórias")) {
            Map<String, Object> entities = extractTerminationEntities(message);
            return NluResult.builder()
                    .intent("calculate_termination")
                    .confidence(0.90)
                    .entities(entities)
                    .actionType(AiIntent.ActionType.CALCULATION)
                    .build();
        }

        // Employee and Department queries
        if (containsAny(normalizedMessage, "funcionários", "colaboradores", "empregados", "quem trabalha", 
                "departamento", "setor", "setores", "área", "áreas", "cargo", "cargos", "posição", "posições")) {
            Map<String, Object> entities = extractEmployeeQueryEntities(message);
            return NluResult.builder()
                    .intent("query_employee")
                    .confidence(0.88)
                    .entities(entities)
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Salary queries
        if (containsAny(normalizedMessage, "salário", "salarios", "remuneração", "quanto ganha", "quanto recebe", 
                "faixa salarial", "salário base")) {
            return NluResult.builder()
                    .intent("query_salary")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Address queries
        if (containsAny(normalizedMessage, "endereço", "enderecos", "onde mora", "moram", "cidade", "estado", "cep")) {
            return NluResult.builder()
                    .intent("query_address")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Dependents queries
        if (containsAny(normalizedMessage, "dependente", "dependentes", "filho", "filhos", "cônjuge", "esposa", "marido")) {
            return NluResult.builder()
                    .intent("query_dependents")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Vacation requests queries
        if (containsAny(normalizedMessage, "férias pendentes", "solicitação de férias", "pedido de férias", 
                "férias aprovadas", "férias rejeitadas")) {
            return NluResult.builder()
                    .intent("query_vacation_requests")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Timesheet/Ponto queries
        if (containsAny(normalizedMessage, "ponto", "registro de ponto", "batida", "batidas", "hora extra", 
                "horas extras", "banco de horas", "overtime")) {
            return NluResult.builder()
                    .intent("query_timesheet")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Payroll queries
        if (containsAny(normalizedMessage, "contracheque", "holerite", "folha de pagamento", "folha", 
                "pagamento", "quanto ganhei", "salário líquido", "salário bruto")) {
            return NluResult.builder()
                    .intent("query_payroll")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Performance/Evaluation queries
        if (containsAny(normalizedMessage, "avaliação", "avaliações", "desempenho", "performance", 
                "meta", "metas", "objetivo", "objetivos")) {
            return NluResult.builder()
                    .intent("query_performance")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Training/Learning queries
        if (containsAny(normalizedMessage, "treinamento", "treinamentos", "curso", "cursos", "capacitação", 
                "certificado", "certificados", "matrícula")) {
            return NluResult.builder()
                    .intent("query_training")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // HR policies
        if (containsAny(normalizedMessage, "política", "regra", "procedimento", "norma")) {
            String topic = extractPolicyTopic(message);
            return NluResult.builder()
                    .intent("hr_policy")
                    .confidence(0.85)
                    .entities(Map.of("topic", topic))
                    .actionType(AiIntent.ActionType.KNOWLEDGE_SEARCH)
                    .build();
        }

        // Labor law
        if (containsAny(normalizedMessage, "clt", "lei", "legislação", "direito", "trabalhista")) {
            String topic = extractLawTopic(message);
            return NluResult.builder()
                    .intent("labor_law")
                    .confidence(0.85)
                    .entities(Map.of("topic", topic))
                    .actionType(AiIntent.ActionType.KNOWLEDGE_SEARCH)
                    .build();
        }

        // Benefits queries
        if (containsAny(normalizedMessage, "benefício", "benefícios", "plano de saúde", "vale refeição", "vale transporte", "seguro de vida")) {
            return NluResult.builder()
                    .intent("query_benefits")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Notifications
        if (containsAny(normalizedMessage, "notificação", "notificações", "alerta", "aviso", "mensagens")) {
            return NluResult.builder()
                    .intent("query_notifications")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Company Profile
        if (containsAny(normalizedMessage, "dados da empresa", "cnpj da empresa", "razão social", "endereço da empresa")) {
            return NluResult.builder()
                    .intent("query_company")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Certificates
        if (containsAny(normalizedMessage, "certificado digital", "certificado a1", "certificado a3", "validade do certificado")) {
            return NluResult.builder()
                    .intent("query_certificates")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // PDI
        if (containsAny(normalizedMessage, "pdi", "plano de desenvolvimento", "meu desenvolvimento")) {
            return NluResult.builder()
                    .intent("query_pdi")
                    .confidence(0.88)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Talent Pool / Vagas
        if (containsAny(normalizedMessage, "vaga", "vagas", "candidato", "candidatos", "banco de talentos", "processo seletivo")) {
            return NluResult.builder()
                    .intent("query_talent_pool")
                    .confidence(0.90)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Wellbeing / Bem-estar
        if (containsAny(normalizedMessage, "bem-estar", "saúde mental", "clima", "sentimento", "estrela de sentimentos")) {
            return NluResult.builder()
                    .intent("query_wellbeing")
                    .confidence(0.90)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // DISC
        if (containsAny(normalizedMessage, "disc", "perfil comportamental", "teste comportamental", "dominância", "influência", "estabilidade", "conformidade")) {
            return NluResult.builder()
                    .intent("query_disc")
                    .confidence(0.90)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Termination Approval / Process
        if (containsAny(normalizedMessage, "processo de desligamento", "workflow de demissão", "checklist de saída")) {
            return NluResult.builder()
                    .intent("query_termination_process")
                    .confidence(0.90)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.DATABASE_QUERY)
                    .build();
        }

        // Vacation Approval Action
        if (containsAny(normalizedMessage, "aprovar férias", "autorizar férias", "confirmar férias")) {
            Map<String, Object> entities = extractActionEntities(message);
            return NluResult.builder()
                    .intent("propose_vacation_approval")
                    .confidence(0.95)
                    .entities(entities)
                    .actionType(AiIntent.ActionType.ACTION_CONFIRMATION)
                    .build();
        }

        // Termination Action
        if (containsAny(normalizedMessage, "demitir", "desligar funcionário", "iniciar desligamento", "terminar contrato")) {
            Map<String, Object> entities = extractActionEntities(message);
            return NluResult.builder()
                    .intent("propose_termination")
                    .confidence(0.95)
                    .entities(entities)
                    .actionType(AiIntent.ActionType.ACTION_CONFIRMATION)
                    .build();
        }

        return null;
    }

    private Map<String, Object> extractActionEntities(String message) {
        Map<String, Object> entities = new HashMap<>();
        
        // Simple name extraction heuristic: words after "de", "do", "da", "o", "a"
        // This is a naive implementation, ideally we would use NER or look up against employee DB
        Pattern namePattern = Pattern.compile("(?:de|do|da|o|a)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)", Pattern.DOTALL);
        Matcher matcher = namePattern.matcher(message);
        if (matcher.find()) {
            entities.put("employeeName", matcher.group(1));
        }

        return entities;
    }

    private NluResult llmBasedAnalysis(String message, UUID tenantId) {
        try {
            List<AiIntent> intents = intentRepository.findByIsActiveTrueOrderByNameAsc();
            String intentList = intents.stream()
                    .map(i -> String.format("- %s: %s (exemplos: %s)",
                            i.getName(),
                            i.getDescription() != null ? i.getDescription() : "",
                            String.join(", ", i.getTrainingPhrases())))
                    .collect(Collectors.joining("\n"));

            String systemPrompt = NLU_SYSTEM_PROMPT.replace("{intents}", intentList);

            ChatRequest request = ChatRequest.builder()
                    .messages(List.of(
                            ChatMessage.builder()
                                    .role(ChatMessage.Role.SYSTEM)
                                    .content(systemPrompt)
                                    .build(),
                            ChatMessage.builder()
                                    .role(ChatMessage.Role.USER)
                                    .content(message)
                                    .build()
                    ))
                    .temperature(0.3)
                    .maxTokens(500)
                    .build();

            var response = llmService.chat(request);
            JsonNode json = objectMapper.readTree(response.getContent());

            String intentName = json.get("intent").asText();
            double confidence = json.get("confidence").asDouble();
            Map<String, Object> entities = objectMapper.convertValue(
                    json.get("entities"), Map.class);
            Map<String, Object> parameters = json.has("parameters") ?
                    objectMapper.convertValue(json.get("parameters"), Map.class) : Map.of();

            // Get action type from intent definition
            AiIntent.ActionType actionType = intents.stream()
                    .filter(i -> i.getName().equals(intentName))
                    .findFirst()
                    .map(AiIntent::getActionType)
                    .orElse(AiIntent.ActionType.INFORMATION);

            return NluResult.builder()
                    .intent(intentName)
                    .confidence(confidence)
                    .entities(entities)
                    .parameters(parameters)
                    .actionType(actionType)
                    .build();
        } catch (Exception e) {
            log.error("LLM-based NLU failed: {}", e.getMessage(), e);
            return NluResult.builder()
                    .intent("unknown")
                    .confidence(0.0)
                    .entities(Map.of())
                    .actionType(AiIntent.ActionType.INFORMATION)
                    .build();
        }
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    private Map<String, Object> extractVacationEntities(String message) {
        Map<String, Object> entities = new HashMap<>();

        // Extract number of days
        Pattern daysPattern = Pattern.compile("(\\d+)\\s*(dias?)", Pattern.CASE_INSENSITIVE);
        Matcher daysMatcher = daysPattern.matcher(message);
        if (daysMatcher.find()) {
            entities.put("days", Integer.parseInt(daysMatcher.group(1)));
        }

        // Extract salary
        Pattern salaryPattern = Pattern.compile("R\\$\\s*([\\d.,]+)|salário\\s+de\\s+([\\d.,]+)", Pattern.CASE_INSENSITIVE);
        Matcher salaryMatcher = salaryPattern.matcher(message);
        if (salaryMatcher.find()) {
            String value = salaryMatcher.group(1) != null ? salaryMatcher.group(1) : salaryMatcher.group(2);
            entities.put("salary", parseMoneyValue(value));
        }

        // Check for abono (selling days)
        if (message.toLowerCase().contains("abono") || message.toLowerCase().contains("vender")) {
            entities.put("abono", true);
        }

        return entities;
    }

    private Map<String, Object> extractTerminationEntities(String message) {
        Map<String, Object> entities = new HashMap<>();

        // Extract termination type
        if (containsAny(message.toLowerCase(), "sem justa causa", "demitido")) {
            entities.put("type", "SEM_JUSTA_CAUSA");
        } else if (containsAny(message.toLowerCase(), "justa causa")) {
            entities.put("type", "JUSTA_CAUSA");
        } else if (containsAny(message.toLowerCase(), "pedido de demissão", "pedir demissão")) {
            entities.put("type", "PEDIDO_DEMISSAO");
        } else if (containsAny(message.toLowerCase(), "acordo", "comum acordo")) {
            entities.put("type", "ACORDO");
        }

        // Extract tenure
        Pattern tenurePattern = Pattern.compile("(\\d+)\\s*(anos?|meses?)", Pattern.CASE_INSENSITIVE);
        Matcher tenureMatcher = tenurePattern.matcher(message);
        if (tenureMatcher.find()) {
            int value = Integer.parseInt(tenureMatcher.group(1));
            String unit = tenureMatcher.group(2).toLowerCase();
            if (unit.startsWith("ano")) {
                entities.put("tenureMonths", value * 12);
            } else {
                entities.put("tenureMonths", value);
            }
        }

        return entities;
    }

    private Map<String, Object> extractEmployeeQueryEntities(String message) {
        Map<String, Object> entities = new HashMap<>();

        // Common department names
        List<String> departments = List.of("TI", "RH", "Financeiro", "Vendas", "Marketing",
                "Operações", "Administrativo", "Jurídico", "Contabilidade");

        for (String dept : departments) {
            if (message.toLowerCase().contains(dept.toLowerCase())) {
                entities.put("department", dept);
                break;
            }
        }

        // Extract status
        if (message.toLowerCase().contains("ativos") || message.toLowerCase().contains("ativas")) {
            entities.put("status", "ACTIVE");
        } else if (message.toLowerCase().contains("inativos") || message.toLowerCase().contains("demitidos")) {
            entities.put("status", "INACTIVE");
        }

        return entities;
    }

    private String extractPolicyTopic(String message) {
        String lower = message.toLowerCase();
        if (lower.contains("férias")) return "vacation";
        if (lower.contains("home office") || lower.contains("remoto")) return "remote_work";
        if (lower.contains("benefício")) return "benefits";
        if (lower.contains("conduta")) return "code_of_conduct";
        if (lower.contains("vestimenta") || lower.contains("roupa")) return "dress_code";
        return "general";
    }

    private String extractLawTopic(String message) {
        String lower = message.toLowerCase();
        if (lower.contains("férias")) return "vacation";
        if (lower.contains("hora extra")) return "overtime";
        if (lower.contains("rescisão") || lower.contains("demissão")) return "termination";
        if (lower.contains("13") || lower.contains("décimo terceiro")) return "thirteenth_salary";
        if (lower.contains("fgts")) return "fgts";
        if (lower.contains("inss")) return "social_security";
        return "general";
    }

    private double parseMoneyValue(String value) {
        return Double.parseDouble(value.replace(".", "").replace(",", "."));
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class NluResult {
        private String intent;
        private double confidence;
        private Map<String, Object> entities;
        private Map<String, Object> parameters;
        private AiIntent.ActionType actionType;
    }
}
