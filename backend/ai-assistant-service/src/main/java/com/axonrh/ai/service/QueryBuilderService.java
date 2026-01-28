package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
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
            "explanation": "Explicação breve da consulta",
            "template_used": "nome_do_template ou null se customizada"
        }

        Responda APENAS com o JSON.
        """;

    private static final String DATABASE_SCHEMA = """
        -- Funcionários
        employees (id, tenant_id, employee_code, full_name, email, cpf, hire_date, termination_date,
                   birth_date, department_id, position_id, manager_id, status, salary, work_schedule_id)

        -- Departamentos
        departments (id, tenant_id, name, code, parent_id, manager_id, cost_center)

        -- Cargos
        positions (id, tenant_id, title, level, department_id, min_salary, max_salary)

        -- Folha de Pagamento
        payroll_periods (id, tenant_id, employee_id, reference_month, gross_salary, net_salary,
                        total_deductions, total_benefits, status)

        -- Férias
        vacation_balances (id, tenant_id, employee_id, available_days, used_days, pending_days,
                          acquisition_period_start, acquisition_period_end)

        -- Registro de Ponto
        time_entries (id, tenant_id, employee_id, entry_date, clock_in, clock_out, break_start,
                     break_end, total_hours, overtime_hours, status)
        """;

    public QueryResult buildAndExecuteQuery(String question, Map<String, Object> entities,
                                             UUID tenantId, List<String> userPermissions) {
        try {
            // First, try to find a matching template
            QueryResult templateResult = tryTemplateMatch(question, entities, tenantId);
            if (templateResult != null) {
                return templateResult;
            }

            // Fall back to LLM-generated query
            return generateAndExecuteQuery(question, entities, tenantId, userPermissions);
        } catch (Exception e) {
            log.error("Query building failed: {}", e.getMessage(), e);
            return QueryResult.builder()
                    .success(false)
                    .error("Não foi possível executar a consulta: " + e.getMessage())
                    .build();
        }
    }

    private QueryResult tryTemplateMatch(String question, Map<String, Object> entities, UUID tenantId) {
        List<QueryTemplate> templates = queryTemplateRepository.findAllWithDefaults(tenantId);

        for (QueryTemplate template : templates) {
            if (matchesTemplate(question, template)) {
                Map<String, Object> params = buildTemplateParams(template, entities, tenantId);
                return executeQuery(template.getSqlTemplate(), params, template.getName());
            }
        }

        return null;
    }

    private boolean matchesTemplate(String question, QueryTemplate template) {
        String lowerQuestion = question.toLowerCase();

        for (String example : template.getExamples()) {
            if (similarityScore(lowerQuestion, example.toLowerCase()) > 0.6) {
                return true;
            }
        }

        return false;
    }

    private double similarityScore(String s1, String s2) {
        Set<String> words1 = new HashSet<>(Arrays.asList(s1.split("\\s+")));
        Set<String> words2 = new HashSet<>(Arrays.asList(s2.split("\\s+")));

        Set<String> intersection = new HashSet<>(words1);
        intersection.retainAll(words2);

        Set<String> union = new HashSet<>(words1);
        union.addAll(words2);

        return (double) intersection.size() / union.size();
    }

    private Map<String, Object> buildTemplateParams(QueryTemplate template, Map<String, Object> entities, UUID tenantId) {
        Map<String, Object> params = new HashMap<>();
        params.put("tenant_id", tenantId);

        for (QueryTemplate.QueryParameter param : template.getParameters()) {
            Object value = entities.get(param.getName());
            if (value == null && param.getDefaultValue() != null) {
                value = param.getDefaultValue();
            }
            if (value != null || !param.isRequired()) {
                params.put(param.getName(), value);
            }
        }

        return params;
    }

    private QueryResult generateAndExecuteQuery(String question, Map<String, Object> entities,
                                                 UUID tenantId, List<String> userPermissions) {
        try {
            List<QueryTemplate> templates = queryTemplateRepository.findAllWithDefaults(tenantId);
            String templatesStr = templates.stream()
                    .map(t -> String.format("- %s: %s\n  SQL: %s",
                            t.getName(), t.getDescription(), t.getSqlTemplate()))
                    .reduce("", (a, b) -> a + "\n" + b);

            String prompt = QUERY_BUILDER_PROMPT
                    .replace("{schema}", DATABASE_SCHEMA)
                    .replace("{templates}", templatesStr)
                    .replace("{question}", question)
                    .replace("{entities}", objectMapper.writeValueAsString(entities));

            ChatRequest request = ChatRequest.builder()
                    .messages(List.of(
                            ChatMessage.builder()
                                    .role(ChatMessage.Role.SYSTEM)
                                    .content(prompt)
                                    .build(),
                            ChatMessage.builder()
                                    .role(ChatMessage.Role.USER)
                                    .content(question)
                                    .build()
                    ))
                    .temperature(0.2)
                    .maxTokens(1000)
                    .build();

            var response = llmService.chat(request);
            String content = extractJson(response.getContent());
            JsonNode json = objectMapper.readTree(content);

            String sql = json.get("sql").asText();
            String explanation = json.get("explanation").asText();
            Map<String, Object> parameters = objectMapper.convertValue(
                    json.get("parameters"), Map.class);

            // Security validation
            if (!isQuerySafe(sql)) {
                return QueryResult.builder()
                        .success(false)
                        .error("A consulta gerada não passou na validação de segurança")
                        .build();
            }

            // Add tenant_id
            parameters.put("tenant_id", tenantId);

            // Execute and return
            QueryResult result = executeQuery(sql, parameters, null);
            result.setExplanation(explanation);
            result.setSql(sql);
            return result;

        } catch (Exception e) {
            log.error("Query generation failed: {}", e.getMessage(), e);
            return QueryResult.builder()
                    .success(false)
                    .error("Falha ao gerar consulta: " + e.getMessage())
                    .build();
        }
    }

    private boolean isQuerySafe(String sql) {
        String upperSql = sql.toUpperCase().trim();

        // Must be a SELECT query
        if (!upperSql.startsWith("SELECT")) {
            log.warn("Query is not a SELECT: {}", sql);
            return false;
        }

        // Forbidden keywords
        List<String> forbidden = List.of("INSERT", "UPDATE", "DELETE", "DROP", "ALTER",
                "CREATE", "TRUNCATE", "GRANT", "REVOKE", "EXEC", "EXECUTE");

        for (String keyword : forbidden) {
            if (upperSql.contains(keyword + " ") || upperSql.contains(keyword + "(")) {
                log.warn("Query contains forbidden keyword {}: {}", keyword, sql);
                return false;
            }
        }

        // Must contain tenant_id filter
        if (!upperSql.contains("TENANT_ID")) {
            log.warn("Query missing tenant_id filter: {}", sql);
            return false;
        }

        // Check for SQL injection patterns
        Pattern injectionPattern = Pattern.compile(
                "(--)|(/\\*)|'\\s*(OR|AND)\\s+'", Pattern.CASE_INSENSITIVE);
        if (injectionPattern.matcher(sql).find()) {
            log.warn("Potential SQL injection detected: {}", sql);
            return false;
        }

        return true;
    }

    private QueryResult executeQuery(String sql, Map<String, Object> params, String templateName) {
        try {
            MapSqlParameterSource paramSource = new MapSqlParameterSource(params);
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, paramSource);

            return QueryResult.builder()
                    .success(true)
                    .data(results)
                    .rowCount(results.size())
                    .templateUsed(templateName)
                    .build();
        } catch (Exception e) {
            log.error("Query execution failed: {}", e.getMessage());
            return QueryResult.builder()
                    .success(false)
                    .error("Erro ao executar consulta: " + e.getMessage())
                    .sql(sql)
                    .build();
        }
    }

    private String extractJson(String content) {
        if (content == null) return "";
        content = content.trim();
        int startIndex = content.indexOf("{");
        int endIndex = content.lastIndexOf("}");
        if (startIndex >= 0 && endIndex > startIndex) {
            return content.substring(startIndex, endIndex + 1);
        }
        return content;
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
