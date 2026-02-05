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
    private final DataModificationService dataModificationService;
    private final DataModificationExecutorService dataModificationExecutorService;
    private final NameMatchingService nameMatchingService;
    private final ObjectMapper objectMapper;

    /**
     * Context needed for executing tools (tenant, user, permissions).
     */
    public record ExecutionContext(UUID tenantId, UUID userId, List<String> permissions, String conversationId) {
        public ExecutionContext(UUID tenantId, UUID userId, List<String> permissions) {
            this(tenantId, userId, permissions, null);
        }
    }

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
            case "buscar_funcionario_por_nome" -> executeSearchEmployeeByName(arguments, context);
            case "selecionar_funcionario" -> executeSelectEmployee(arguments, context);
            case "consultar_banco_dados" -> executeQueryDatabase(arguments, context);
            case "buscar_base_conhecimento" -> executeSearchKnowledgeBase(arguments, context);
            case "modificar_dados" -> executeModifyData(arguments, context);
            case "confirmar_operacao" -> executeConfirmOperation(arguments, context);
            case "listar_operacoes_pendentes" -> executeListPendingOperations(arguments, context);
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

    /**
     * Executes intelligent employee search by name with fuzzy matching.
     * Returns disambiguation options when multiple matches are found.
     */
    private String executeSearchEmployeeByName(JsonNode args, ExecutionContext context) throws Exception {
        String nome = getString(args, "nome");
        boolean apenasAtivos = getBoolean(args, "apenas_ativos", true);

        log.info("Searching employee by name with fuzzy matching: name='{}', activeOnly={}", nome, apenasAtivos);

        NameMatchingService.SearchResult result = nameMatchingService.searchByName(
                nome, context.tenantId(), apenasAtivos);

        return formatNameSearchResult(result);
    }

    /**
     * Selects a specific employee from disambiguation options by index or ID.
     */
    private String executeSelectEmployee(JsonNode args, ExecutionContext context) throws Exception {
        String employeeId = getString(args, "employee_id");

        log.info("Selecting employee by ID: {}", employeeId);

        if (employeeId == null || employeeId.isBlank()) {
            return objectMapper.writeValueAsString(Map.of(
                "sucesso", false,
                "erro", "ID do funcionário não fornecido."
            ));
        }

        try {
            UUID id = UUID.fromString(employeeId);
            NameMatchingService.SearchResult result = nameMatchingService.getEmployeeById(id, context.tenantId());
            return formatNameSearchResult(result);
        } catch (IllegalArgumentException e) {
            return objectMapper.writeValueAsString(Map.of(
                "sucesso", false,
                "erro", "ID de funcionário inválido: " + employeeId
            ));
        }
    }

    /**
     * Formats the name search result for LLM consumption.
     */
    private String formatNameSearchResult(NameMatchingService.SearchResult result) throws Exception {
        Map<String, Object> formatted = new LinkedHashMap<>();
        formatted.put("encontrado", result.found());
        formatted.put("correspondencia_exata", result.exactMatch());
        formatted.put("requer_desambiguacao", result.needsDisambiguation());
        formatted.put("mensagem", result.message());

        if (!result.candidates().isEmpty()) {
            List<Map<String, Object>> candidates = new ArrayList<>();
            int index = 1;
            for (NameMatchingService.MatchResult match : result.candidates()) {
                Map<String, Object> candidate = new LinkedHashMap<>();
                candidate.put("indice", index++);
                candidate.put("id", match.employeeId().toString());
                candidate.put("nome_completo", match.fullName());
                if (match.socialName() != null && !match.socialName().isBlank()) {
                    candidate.put("nome_social", match.socialName());
                }
                if (match.department() != null) {
                    candidate.put("departamento", match.department());
                }
                if (match.position() != null) {
                    candidate.put("cargo", match.position());
                }
                candidate.put("similaridade", String.format("%.0f%%", match.similarity() * 100));
                candidates.add(candidate);
            }
            formatted.put("candidatos", candidates);

            if (result.needsDisambiguation()) {
                formatted.put("instrucao",
                    "Apresente a lista de candidatos ao usuário e pergunte qual funcionário ele está procurando. " +
                    "O usuário pode responder com o número (1, 2, 3...) ou o nome completo. " +
                    "Quando o usuário escolher, use a ferramenta 'selecionar_funcionario' com o ID correspondente.");
            }
        }

        return objectMapper.writeValueAsString(formatted);
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

    // === Data Modification Tools ===

    /**
     * Executes data modification command (creates pending operation).
     */
    private String executeModifyData(JsonNode args, ExecutionContext context) throws Exception {
        String comando = getString(args, "comando");
        String tipoEntidade = getString(args, "tipo_entidade", "funcionario");
        String contexto = getString(args, "contexto", null);

        log.info("Processing data modification: command='{}', entityType='{}'", comando, tipoEntidade);

        Map<String, Object> additionalContext = new HashMap<>();
        additionalContext.put("tipo_entidade", tipoEntidade);
        if (contexto != null) {
            additionalContext.put("contexto_adicional", contexto);
        }

        com.axonrh.ai.dto.DataModificationResponse response = dataModificationService.processModificationCommand(
                comando,
                context.tenantId(),
                context.userId(),
                context.conversationId(),
                additionalContext);

        return formatModificationResponse(response);
    }

    /**
     * Executes operation confirmation (approve or reject).
     */
    private String executeConfirmOperation(JsonNode args, ExecutionContext context) throws Exception {
        String operationIdStr = getString(args, "operation_id");
        boolean confirmar = getBoolean(args, "confirmar", false);
        String motivoRejeicao = getString(args, "motivo_rejeicao", null);

        log.info("Processing operation confirmation: operationId='{}', confirm={}", operationIdStr, confirmar);

        UUID operationId;
        try {
            operationId = UUID.fromString(operationIdStr);
        } catch (IllegalArgumentException e) {
            return objectMapper.writeValueAsString(Map.of(
                "sucesso", false,
                "erro", "ID de operação inválido: " + operationIdStr
            ));
        }

        com.axonrh.ai.dto.OperationConfirmationRequest request = com.axonrh.ai.dto.OperationConfirmationRequest.builder()
                .operationId(operationId)
                .confirmed(confirmar)
                .rejectionReason(motivoRejeicao)
                .conversationId(context.conversationId())
                .build();

        com.axonrh.ai.dto.OperationConfirmationResponse response = dataModificationExecutorService.processConfirmation(
                request, context.tenantId(), context.userId());

        return formatConfirmationResponse(response);
    }

    /**
     * Executes list pending operations.
     */
    private String executeListPendingOperations(JsonNode args, ExecutionContext context) throws Exception {
        String conversationId = getString(args, "conversation_id", context.conversationId());
        boolean incluirHistorico = getBoolean(args, "incluir_historico", false);

        log.info("Listing pending operations for conversation: {}", conversationId);

        List<com.axonrh.ai.entity.PendingOperation> operations;

        if (conversationId != null) {
            operations = dataModificationExecutorService.getPendingOperationsForConversation(
                    conversationId, context.tenantId());
        } else {
            // Just return count if no conversation specified
            long count = dataModificationExecutorService.countPendingOperations(
                    context.tenantId(), context.userId());
            return objectMapper.writeValueAsString(Map.of(
                "total_pendentes", count,
                "mensagem", count > 0
                    ? String.format("Você tem %d operação(ões) pendente(s) de confirmação.", count)
                    : "Você não tem operações pendentes."
            ));
        }

        if (operations.isEmpty()) {
            return objectMapper.writeValueAsString(Map.of(
                "encontrado", false,
                "total", 0,
                "mensagem", "Não há operações pendentes nesta conversa."
            ));
        }

        List<Map<String, Object>> formattedOps = new ArrayList<>();
        for (com.axonrh.ai.entity.PendingOperation op : operations) {
            Map<String, Object> opMap = new LinkedHashMap<>();
            opMap.put("id", op.getId().toString());
            opMap.put("tipo", op.getOperationType().toString());
            opMap.put("status", op.getStatus().toString());
            opMap.put("descricao", op.getDescription());
            opMap.put("entidade", op.getTargetEntity());
            opMap.put("nivel_risco", op.getRiskLevel().toString());
            opMap.put("expira_em", op.getExpiresAt() != null ? op.getExpiresAt().toString() : null);

            if (op.getChangesSummary() != null && !op.getChangesSummary().isEmpty()) {
                List<Map<String, Object>> changes = new ArrayList<>();
                for (var change : op.getChangesSummary()) {
                    changes.add(Map.of(
                        "campo", change.getFieldLabel(),
                        "de", change.getOldValue() != null ? change.getOldValue().toString() : "(vazio)",
                        "para", change.getNewValue() != null ? change.getNewValue().toString() : "(vazio)"
                    ));
                }
                opMap.put("alteracoes", changes);
            }

            formattedOps.add(opMap);
        }

        return objectMapper.writeValueAsString(Map.of(
            "encontrado", true,
            "total", operations.size(),
            "operacoes", formattedOps,
            "instrucao", "Para confirmar uma operação, o usuário pode dizer 'confirmar' ou 'sim'. Para cancelar, 'cancelar' ou 'não'."
        ));
    }

    /**
     * Format modification response for LLM.
     */
    private String formatModificationResponse(com.axonrh.ai.dto.DataModificationResponse response) throws Exception {
        Map<String, Object> formatted = new LinkedHashMap<>();

        if (response.getOperationId() == null) {
            // Error case
            formatted.put("sucesso", false);
            formatted.put("erro", response.getDescription());
            formatted.put("requer_confirmacao", false);
            return objectMapper.writeValueAsString(formatted);
        }

        formatted.put("sucesso", true);
        formatted.put("operacao_id", response.getOperationId().toString());
        formatted.put("tipo_operacao", response.getOperationType().toString());
        formatted.put("status", response.getStatus().toString());
        formatted.put("nivel_risco", response.getRiskLevel().toString());
        formatted.put("entidade", response.getTargetEntity());
        formatted.put("nome_entidade", response.getTargetEntityName());
        formatted.put("descricao", response.getDescription());
        formatted.put("requer_confirmacao", response.isRequiresConfirmation());

        if (response.getChanges() != null && !response.getChanges().isEmpty()) {
            List<Map<String, Object>> changes = new ArrayList<>();
            for (var change : response.getChanges()) {
                Map<String, Object> changeMap = new LinkedHashMap<>();
                changeMap.put("campo", change.getFieldLabel());
                changeMap.put("valor_atual", change.getOldValue() != null ? change.getOldValue() : "(vazio)");
                changeMap.put("novo_valor", change.getNewValue() != null ? change.getNewValue() : "(vazio)");
                if (change.isSensitive()) {
                    changeMap.put("sensivel", true);
                }
                changes.add(changeMap);
            }
            formatted.put("alteracoes", changes);
        }

        if (response.getWarningMessage() != null) {
            formatted.put("aviso", response.getWarningMessage());
        }

        formatted.put("mensagem_confirmacao", response.getConfirmationMessage());
        formatted.put("expira_em", response.getExpiresAt() != null ? response.getExpiresAt().toString() : null);

        // Instructions for the LLM
        formatted.put("instrucao_resposta",
            "IMPORTANTE: Apresente as alterações de forma clara e peça confirmação explícita do usuário. " +
            "Mostre as alterações em formato de tabela ou lista. " +
            "Informe que o usuário deve responder 'confirmar' ou 'cancelar'. " +
            "Use o tipo de mensagem ACTION_CONFIRMATION para que o frontend exiba os botões de confirmação.");

        return objectMapper.writeValueAsString(formatted);
    }

    /**
     * Format confirmation response for LLM.
     */
    private String formatConfirmationResponse(com.axonrh.ai.dto.OperationConfirmationResponse response) throws Exception {
        Map<String, Object> formatted = new LinkedHashMap<>();

        formatted.put("sucesso", response.isSuccess());
        formatted.put("operacao_id", response.getOperationId() != null ? response.getOperationId().toString() : null);
        formatted.put("status", response.getStatus() != null ? response.getStatus().toString() : null);
        formatted.put("mensagem", response.getMessage());

        if (response.isSuccess() && response.getStatus() == com.axonrh.ai.entity.PendingOperation.OperationStatus.EXECUTED) {
            formatted.put("entidade", response.getTargetEntity());
            formatted.put("nome_entidade", response.getTargetEntityName());
            formatted.put("registros_afetados", response.getAffectedRecordsCount());
            formatted.put("executado_em", response.getExecutedAt() != null ? response.getExecutedAt().toString() : null);
            formatted.put("pode_reverter", response.isCanRollback());
            if (response.isCanRollback() && response.getRollbackDeadline() != null) {
                formatted.put("prazo_reversao", response.getRollbackDeadline().toString());
            }
        }

        return objectMapper.writeValueAsString(formatted);
    }
}
