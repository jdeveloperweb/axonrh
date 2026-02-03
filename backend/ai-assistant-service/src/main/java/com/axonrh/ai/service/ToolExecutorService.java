package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatMessage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Service responsible for executing tool calls made by the LLM.
 * Bridges the gap between LLM function calls and actual service implementations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ToolExecutorService {

    private final CalculationService calculationService;
    private final QueryBuilderService queryBuilderService;
    private final KnowledgeService knowledgeService;
    private final ObjectMapper objectMapper;

    /**
     * Context needed for executing tools (tenant, user, permissions).
     */
    public record ExecutionContext(UUID tenantId, UUID userId, List<String> permissions) {}

    /**
     * Result of a tool execution.
     */
    public record ToolResult(String toolCallId, String functionName, String result, boolean success) {}

    /**
     * Executes a list of tool calls and returns the results.
     */
    public List<ToolResult> executeToolCalls(List<ChatMessage.ToolCall> toolCalls, ExecutionContext context) {
        List<ToolResult> results = new ArrayList<>();

        for (ChatMessage.ToolCall toolCall : toolCalls) {
            log.info("Executing tool call: {} (id: {})", toolCall.getFunction().getName(), toolCall.getId());

            try {
                String result = executeToolCall(toolCall, context);
                results.add(new ToolResult(toolCall.getId(), toolCall.getFunction().getName(), result, true));
            } catch (Exception e) {
                log.error("Error executing tool {}: {}", toolCall.getFunction().getName(), e.getMessage(), e);
                String errorResult = formatError(e.getMessage());
                results.add(new ToolResult(toolCall.getId(), toolCall.getFunction().getName(), errorResult, false));
            }
        }

        return results;
    }

    /**
     * Executes a single tool call.
     */
    private String executeToolCall(ChatMessage.ToolCall toolCall, ExecutionContext context) throws Exception {
        String functionName = toolCall.getFunction().getName();
        JsonNode arguments = objectMapper.readTree(toolCall.getFunction().getArguments());

        return switch (functionName) {
            case "calcular_ferias" -> executeCalculateVacation(arguments);
            case "calcular_rescisao" -> executeCalculateTermination(arguments);
            case "calcular_horas_extras" -> executeCalculateOvertime(arguments);
            case "consultar_funcionarios" -> executeQueryEmployees(arguments, context);
            case "consultar_banco_dados" -> executeQueryDatabase(arguments, context);
            case "buscar_base_conhecimento" -> executeSearchKnowledgeBase(arguments, context);
            default -> throw new IllegalArgumentException("Unknown function: " + functionName);
        };
    }

    /**
     * Executes vacation calculation.
     */
    private String executeCalculateVacation(JsonNode args) throws Exception {
        BigDecimal salarioBase = getBigDecimal(args, "salario_base");
        int diasFerias = getInt(args, "dias_ferias", 30);
        boolean abonoPecuniario = getBoolean(args, "abono_pecuniario", false);
        int dependentes = getInt(args, "dependentes", 0);

        log.debug("Calculating vacation: salary={}, days={}, abono={}, dependents={}",
                salarioBase, diasFerias, abonoPecuniario, dependentes);

        CalculationService.CalculationResult result = calculationService.calculateVacation(
                salarioBase, diasFerias, abonoPecuniario, dependentes);

        return formatCalculationResult(result);
    }

    /**
     * Executes termination calculation.
     */
    private String executeCalculateTermination(JsonNode args) throws Exception {
        BigDecimal salarioBase = getBigDecimal(args, "salario_base");
        LocalDate dataAdmissao = getDate(args, "data_admissao");
        LocalDate dataDesligamento = getDate(args, "data_desligamento", LocalDate.now());
        String tipoRescisao = getString(args, "tipo_rescisao");
        int diasFeriasGozadas = getInt(args, "dias_ferias_gozadas", 0);
        boolean avisoPrevioTrabalhado = getBoolean(args, "aviso_previo_trabalhado", false);
        BigDecimal saldoFgts = getBigDecimal(args, "saldo_fgts", BigDecimal.ZERO);

        log.debug("Calculating termination: salary={}, hireDate={}, termDate={}, type={}",
                salarioBase, dataAdmissao, dataDesligamento, tipoRescisao);

        CalculationService.CalculationResult result = calculationService.calculateTermination(
                salarioBase, dataAdmissao, dataDesligamento, tipoRescisao,
                diasFeriasGozadas, avisoPrevioTrabalhado, saldoFgts);

        return formatCalculationResult(result);
    }

    /**
     * Executes overtime calculation.
     */
    private String executeCalculateOvertime(JsonNode args) throws Exception {
        BigDecimal valorHora = getBigDecimal(args, "valor_hora");
        double horasNormais = getDouble(args, "horas_normais", 0);
        double horasExtras50 = getDouble(args, "horas_extras_50", 0);
        double horasExtras100 = getDouble(args, "horas_extras_100", 0);
        double horasNoturnas = getDouble(args, "horas_noturnas", 0);

        log.debug("Calculating overtime: hourlyRate={}, regular={}, ot50={}, ot100={}, night={}",
                valorHora, horasNormais, horasExtras50, horasExtras100, horasNoturnas);

        CalculationService.CalculationResult result = calculationService.calculateOvertime(
                valorHora, horasNormais, horasExtras50, horasExtras100, horasNoturnas);

        return formatCalculationResult(result);
    }

    /**
     * Executes employee query using QueryBuilderService.
     */
    private String executeQueryEmployees(JsonNode args, ExecutionContext context) throws Exception {
        String filtro = getString(args, "filtro");
        String status = getString(args, "status", "ACTIVE");
        int limite = getInt(args, "limite", 10);
        List<String> campos = getStringList(args, "campos", List.of("nome", "cargo", "departamento"));

        // Build a natural language query for QueryBuilderService
        String question = buildEmployeeQuery(filtro, status, limite, campos);

        log.debug("Querying employees: filter={}, status={}, limit={}, campos={}", filtro, status, limite, campos);

        QueryBuilderService.QueryResult result = queryBuilderService.buildAndExecuteQuery(
                question, Map.of("status", status, "limit", limite, "campos", campos),
                context.tenantId(), List.of());

        return formatQueryResult(result);
    }

    /**
     * Executes custom database query.
     */
    private String executeQueryDatabase(JsonNode args, ExecutionContext context) throws Exception {
        String pergunta = getString(args, "pergunta");

        log.debug("Executing database query: {}", pergunta);

        QueryBuilderService.QueryResult result = queryBuilderService.buildAndExecuteQuery(
                pergunta, Map.of(), context.tenantId(), List.of());

        return formatQueryResult(result);
    }

    /**
     * Executes knowledge base search.
     */
    private String executeSearchKnowledgeBase(JsonNode args, ExecutionContext context) throws Exception {
        String consulta = getString(args, "consulta");
        int maxResultados = getInt(args, "max_resultados", 3);

        log.debug("Searching knowledge base: query={}, maxResults={}", consulta, maxResultados);

        List<KnowledgeService.SearchResult> results = knowledgeService.search(
                consulta, context.tenantId(), maxResultados);

        return formatKnowledgeResults(results);
    }

    // === Helper methods for building queries ===

    private String buildEmployeeQuery(String filtro, String status, int limite, List<String> campos) {
        String camposStr = String.join(", ", campos);
        if ("todos".equalsIgnoreCase(filtro)) {
            return String.format("Listar funcionários com status %s, retornando os campos: %s, limite de %d registros",
                    status, camposStr, limite);
        }
        return String.format("Buscar funcionários onde nome, cargo ou departamento contém '%s', status %s, retornando os campos: %s, limite %d",
                filtro, status, camposStr, limite);
    }

    // === Helper methods for extracting arguments ===

    private String getString(JsonNode args, String field) {
        return args.has(field) ? args.get(field).asText() : null;
    }

    private String getString(JsonNode args, String field, String defaultValue) {
        return args.has(field) ? args.get(field).asText() : defaultValue;
    }

    private int getInt(JsonNode args, String field, int defaultValue) {
        return args.has(field) ? args.get(field).asInt(defaultValue) : defaultValue;
    }

    private double getDouble(JsonNode args, String field, double defaultValue) {
        return args.has(field) ? args.get(field).asDouble(defaultValue) : defaultValue;
    }

    private boolean getBoolean(JsonNode args, String field, boolean defaultValue) {
        return args.has(field) ? args.get(field).asBoolean(defaultValue) : defaultValue;
    }

    private BigDecimal getBigDecimal(JsonNode args, String field) {
        if (!args.has(field)) {
            throw new IllegalArgumentException("Required field missing: " + field);
        }
        return new BigDecimal(args.get(field).asText());
    }

    private BigDecimal getBigDecimal(JsonNode args, String field, BigDecimal defaultValue) {
        return args.has(field) ? new BigDecimal(args.get(field).asText()) : defaultValue;
    }

    private LocalDate getDate(JsonNode args, String field) {
        if (!args.has(field)) {
            throw new IllegalArgumentException("Required field missing: " + field);
        }
        return LocalDate.parse(args.get(field).asText());
    }

    private LocalDate getDate(JsonNode args, String field, LocalDate defaultValue) {
        return args.has(field) ? LocalDate.parse(args.get(field).asText()) : defaultValue;
    }

    private List<String> getStringList(JsonNode args, String field, List<String> defaultValue) {
        if (!args.has(field) || !args.get(field).isArray()) {
            return defaultValue;
        }
        List<String> result = new ArrayList<>();
        for (JsonNode item : args.get(field)) {
            result.add(item.asText());
        }
        return result.isEmpty() ? defaultValue : result;
    }

    // === Helper methods for formatting results ===

    private String formatCalculationResult(CalculationService.CalculationResult result) throws Exception {
        Map<String, Object> formatted = new LinkedHashMap<>();
        formatted.put("tipo", result.getType());
        formatted.put("valor_bruto", String.format("R$ %.2f", result.getGrossValue()));
        formatted.put("valor_liquido", String.format("R$ %.2f", result.getNetValue()));
        formatted.put("memoria_calculo", result.getSteps());
        formatted.put("base_legal", result.getLegalBasis());
        formatted.put("detalhes", result.getDetails());

        return objectMapper.writeValueAsString(formatted);
    }

    private String formatQueryResult(QueryBuilderService.QueryResult result) throws Exception {
        Map<String, Object> formatted = new LinkedHashMap<>();
        formatted.put("sucesso", result.isSuccess());

        if (result.isSuccess()) {
            formatted.put("total_registros", result.getRowCount());
            formatted.put("explicacao", result.getExplanation());
            formatted.put("dados", result.getData());
            if (result.getRowCount() > 0) {
                formatted.put("instrucao_formatacao", "Apresente estes dados em formato de TABELA MARKDOWN para o usuário. Use | para separar colunas.");
            }
        } else {
            formatted.put("erro", result.getError());
        }

        return objectMapper.writeValueAsString(formatted);
    }

    private String formatKnowledgeResults(List<KnowledgeService.SearchResult> results) throws Exception {
        if (results.isEmpty()) {
            return objectMapper.writeValueAsString(Map.of(
                "encontrado", false,
                "mensagem", "Nenhum documento relevante encontrado na base de conhecimento."
            ));
        }

        List<Map<String, Object>> formattedResults = new ArrayList<>();
        for (KnowledgeService.SearchResult r : results) {
            Map<String, Object> doc = new LinkedHashMap<>();
            doc.put("titulo", r.getDocumentTitle());
            doc.put("conteudo", r.getContent());
            doc.put("relevancia", String.format("%.0f%%", r.getSimilarity() * 100));
            formattedResults.add(doc);
        }

        return objectMapper.writeValueAsString(Map.of(
            "encontrado", true,
            "total", results.size(),
            "documentos", formattedResults
        ));
    }

    private String formatError(String message) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                "erro", true,
                "mensagem", message
            ));
        } catch (Exception e) {
            return "{\"erro\": true, \"mensagem\": \"Erro interno\"}";
        }
    }
}
