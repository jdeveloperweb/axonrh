package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
import com.axonrh.ai.dto.ChatResponse;
import com.axonrh.ai.entity.QueryTemplate;
import com.axonrh.ai.repository.QueryTemplateRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class QueryBuilderService {

    private final QueryTemplateRepository queryTemplateRepository;
    private final LlmService llmService;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    private static final String QUERY_BUILDER_PROMPT = """
        Você é um assistente especializado em converter perguntas em linguagem natural para consultas SQL.

        IMPORTANTE:
        - Gere APENAS consultas SELECT (somente leitura)
        - SEMPRE inclua filtro por tenant_id = :tenant_id
        - Use aliases claros para as tabelas
        - Limite resultados a 100 registros por padrão
        - Proteja contra SQL injection usando parâmetros nomeados (:param)

        Esquema do banco de dados:
        {schema}

        Templates de consulta disponíveis:
        {templates}

        Pergunta do usuário: {question}
        Entidades identificadas: {entities}

        Responda com um JSON contendo:
        {
            "sql": "SELECT ... FROM ... WHERE tenant_id = :tenant_id ...",
            "parameters": {"param1": "value1"},
            "explanation": "Explicação breve da consulta, para uma pessoa comum,não se falar de SQL ou campo,explica para uma pessoa comum que irá interpretar a informação",
            "template_used": "nome_do_template ou null se customizada"
        }

        Responda APENAS com o JSON.
        """;

    private static final String DATABASE_SCHEMA = """
        -- Funcionários
        shared.employees (id, tenant_id, registration_number, full_name, email, cpf, hire_date, termination_date,
                   birth_date, department_id, position_id, manager_id, status, base_salary, work_schedule_id)

        -- Departamentos
        shared.departments (id, tenant_id, name, code, parent_id, manager_id, cost_center_id)

        -- Cargos
        shared.positions (id, tenant_id, title, level, department_id, min_salary, max_salary)

        -- Folha de Pagamento
        shared.payroll_periods (id, tenant_id, employee_id, reference_month, gross_salary, net_salary,
                        total_deductions, total_benefits, status)

        -- Férias
        shared.vacation_balances (id, tenant_id, employee_id, available_days, used_days, pending_days,
                          acquisition_period_start, acquisition_period_end)

        -- Registro de Ponto
        shared.time_entries (id, tenant_id, employee_id, entry_date, clock_in, clock_out, break_start,
                     break_end, total_hours, overtime_hours, status)
        """;

    public QueryResult buildAndExecuteQuery(String question, Map<String, Object> entities, UUID tenantId, List<Object> permissions) {
        log.info("Building SQL query for question: '{}' (tenantId: {})", question, tenantId);
        try {
            // Get available templates
            List<QueryTemplate> templates = queryTemplateRepository.findAllWithDefaults(tenantId);
            String templatesStr = formatTemplates(templates);
            log.debug("Found {} query templates", templates.size());

            // Build prompt
            String prompt = QUERY_BUILDER_PROMPT
                    .replace("{schema}", DATABASE_SCHEMA)
                    .replace("{templates}", templatesStr)
                    .replace("{question}", question)
                    .replace("{entities}", entities != null ? entities.toString() : "{}");

            // Call LLM
            ChatRequest request = ChatRequest.builder()
                    .messages(List.of(
                            ChatMessage.builder().role(ChatMessage.Role.SYSTEM).content(prompt).build()
                    ))
                    .temperature(0.1) // Low temperature for stability
                    .build();

            log.debug("Calling LLM for SQL generation...");
            ChatResponse response = llmService.chat(request);
            String rawContent = response.getContent();
            log.info("Raw LLM Response: {}", rawContent);
            
            String jsonContent = extractJson(rawContent);
            log.debug("Extracted JSON: {}", jsonContent);

            // Parse response
            JsonNode root = objectMapper.readTree(jsonContent);
            String sql = root.path("sql").asText();
            
            // Basic validation
            if (sql == null || sql.isBlank()) {
                log.warn("LLM did not generate any SQL: {}", jsonContent);
                return QueryResult.builder()
                        .success(false)
                        .error("LLM não gerou SQL válido")
                        .build();
            }

            String explanation = root.path("explanation").asText();
            String templateUsed = root.path("template_used").asText();
            
            Map<String, Object> params = new HashMap<>();
            if (root.has("parameters")) {
                JsonNode paramsNode = root.get("parameters");
                paramsNode.fields().forEachRemaining(entry -> {
                    JsonNode value = entry.getValue();
                    if (value.isTextual()) {
                        params.put(entry.getKey(), value.asText());
                    } else if (value.isNumber()) {
                        params.put(entry.getKey(), value.numberValue());
                    } else if (value.isBoolean()) {
                        params.put(entry.getKey(), value.booleanValue());
                    } else {
                        params.put(entry.getKey(), value.asText());
                    }
                });
            }
            
            // Enforce tenant isolation
            params.put("tenant_id", tenantId);
            log.info("Executing SQL: {} with params: {}", sql, params);

            // Execute query
            List<Map<String, Object>> data = jdbcTemplate.queryForList(sql, params);
            log.info("Query executed successfully. Result rows: {}", data.size());

            return QueryResult.builder()
                    .success(true)
                    .data(data)
                    .rowCount(data.size())
                    .sql(sql)
                    .explanation(explanation)
                    .templateUsed(templateUsed)
                    .build();

        } catch (Exception e) {
            log.error("Error in QueryBuilderService: {}", e.getMessage(), e);
            return QueryResult.builder()
                    .success(false)
                    .error(e.getMessage())
                    .build();
        }
    }

    private String formatTemplates(List<QueryTemplate> templates) {
        if (templates.isEmpty()) return "Nenhum template disponível.";
        StringBuilder sb = new StringBuilder();
        for (QueryTemplate t : templates) {
            sb.append(String.format("- %s: %s\n", t.getName(), t.getDescription()));
        }
        return sb.toString();
    }

    private String extractJson(String content) {
        if (content == null) return "{}";

        String result = content.trim();
        
        // Remove markdown code blocks if present
        if (result.contains("```json")) {
            int start = result.indexOf("```json");
            int end = result.indexOf("```", start + 7);
            if (end > start) {
                result = result.substring(start + 7, end);
            }
        } else if (result.contains("```")) {
            int start = result.indexOf("```");
            int end = result.indexOf("```", start + 3);
            if (end > start) {
                result = result.substring(start + 3, end);
            }
        }

        result = result.trim();
        
        // Find first {
        int startIndex = result.indexOf("{");
        if (startIndex == -1) return "{}";
        
        // Count braces to find the matching closing brace
        int balance = 0;
        boolean inString = false;
        boolean escape = false;

        for (int i = startIndex; i < result.length(); i++) {
            char c = result.charAt(i);
            
            if (escape) {
                escape = false;
                continue;
            }
            
            if (c == '\\') {
                escape = true;
                continue;
            }
            
            if (c == '"') {
                inString = !inString;
                continue;
            }
            
            if (!inString) {
                if (c == '{') {
                    balance++;
                } else if (c == '}') {
                    balance--;
                    if (balance == 0) {
                        return result.substring(startIndex, i + 1);
                    }
                }
            }
        }
        
        // Fallback if balance never hit 0 (invalid JSON)
        return "{}";
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class QueryResult {
        private boolean success;
        private List<Map<String, Object>> data;
        private int rowCount;
        private String sql;
        private String explanation;
        private String templateUsed;
        private String error;
    }
}
