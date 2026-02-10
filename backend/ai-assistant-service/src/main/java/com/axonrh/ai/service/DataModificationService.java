package com.axonrh.ai.service;

import com.axonrh.ai.dto.*;
import com.axonrh.ai.entity.PendingOperation;
import com.axonrh.ai.entity.PendingOperation.*;
import com.axonrh.ai.repository.PendingOperationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service for processing natural language data modification requests.
 * Converts user commands into pending operations that require confirmation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataModificationService {

    private final LlmService llmService;
    private final PendingOperationRepository operationRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.data-modification.expiration-minutes:30}")
    private int expirationMinutes;

    private static final String MODIFICATION_ANALYSIS_PROMPT = """
        Você é um assistente especializado em interpretar comandos de modificação de dados em linguagem natural.

        IMPORTANTE:
        - Analise o comando do usuário e identifique a operação de dados desejada
        - Extraia todas as informações necessárias para executar a operação
        - Identifique qual entidade será afetada e quais campos serão modificados
        - Gere SQL seguro usando parâmetros nomeados (:param)
        - SEMPRE inclua tenant_id = :tenant_id nas condições WHERE
        - Para UPDATE/DELETE, SEMPRE identifique o registro específico a ser modificado
        - Valide se a operação é segura e não afeta múltiplos registros sem intenção

        ESQUEMA DO BANCO DE DADOS:
        {schema}

        MAPEAMENTO DE CAMPOS (Nome Amigável -> Campo do Banco):
        - Nome/Nome Completo -> full_name
        - Nome Social -> social_name
        - CPF -> cpf
        - Email -> email
        - Email Pessoal -> personal_email
        - Telefone -> phone
        - Celular -> mobile
        - Salário/Salário Base -> base_salary
        - Data de Nascimento -> birth_date
        - Data de Admissão -> hire_date
        - Data de Desligamento -> termination_date
        - Departamento -> department_id (precisa JOIN com departments)
        - Cargo -> position_id (precisa JOIN com positions)
        - Centro de Custo -> cost_center_id
        - Gestor/Gerente -> manager_id
        - Endereço/Rua -> address_street
        - Número -> address_number
        - Complemento -> address_complement
        - Bairro -> address_neighborhood
        - Cidade -> address_city
        - Estado -> address_state
        - CEP -> address_zip_code
        - Status -> status (ACTIVE, INACTIVE, TERMINATED)
        - Regime de Trabalho -> work_regime
        - Tipo de Contrato -> employment_type
        - Carga Horária -> weekly_hours
        - Turno -> shift

        COMANDO DO USUÁRIO: {command}

        CONTEXTO ADICIONAL: {context}

        Responda com um JSON contendo:
        {
            "operation_type": "INSERT" | "UPDATE" | "DELETE",
            "target_table": "nome da tabela (ex: shared.employees)",
            "target_entity": "tipo de entidade em português (ex: Funcionário, Departamento)",
            "description": "Descrição clara da operação em português",
            "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
            "entity_identifier": {
                "search_field": "campo para buscar o registro (ex: full_name, cpf, email)",
                "search_value": "valor para buscar",
                "search_type": "EXACT" | "CONTAINS" | "STARTS_WITH"
            },
            "changes": [
                {
                    "field": "nome do campo no banco",
                    "field_label": "nome amigável do campo em português",
                    "old_value": null,
                    "new_value": "novo valor",
                    "change_type": "UPDATE" | "SET" | "CLEAR"
                }
            ],
            "sql": "UPDATE shared.employees SET field = :new_value WHERE tenant_id = :tenant_id AND id = :entity_id",
            "parameters": {
                "new_value": "valor"
            },
            "validation_query": "SELECT id, full_name, field FROM shared.employees WHERE tenant_id = :tenant_id AND search_field ILIKE :search_value LIMIT 5",
            "validation_params": {
                "search_value": "%valor%"
            },
            "warning": "mensagem de aviso se necessário (ex: esta operação é irreversível)",
            "confirmation_message": "Mensagem amigável para o usuário confirmar a operação"
        }

        REGRAS DE SEGURANÇA:
        1. Para operações de DELETE, risk_level deve ser no mínimo HIGH
        2. Para alteração de salário, risk_level deve ser no mínimo MEDIUM
        3. Para alteração de dados pessoais sensíveis (CPF), risk_level deve ser HIGH
        4. Bulk updates (sem WHERE específico) devem ter risk_level CRITICAL
        5. SEMPRE gere uma validation_query para verificar qual registro será afetado

        Responda APENAS com o JSON, sem explicações adicionais.
        """;

    private static final String DATABASE_SCHEMA = """
        -- TABELA: shared.employees (Funcionários)
        shared.employees (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            registration_number VARCHAR(20),
            cpf VARCHAR(11) NOT NULL,
            full_name VARCHAR(200) NOT NULL,
            social_name VARCHAR(200),
            birth_date DATE,
            gender VARCHAR(20),
            marital_status VARCHAR(20),
            email VARCHAR(200) NOT NULL,
            personal_email VARCHAR(200),
            phone VARCHAR(20),
            mobile VARCHAR(20),
            address_street VARCHAR(200),
            address_number VARCHAR(20),
            address_complement VARCHAR(100),
            address_neighborhood VARCHAR(100),
            address_city VARCHAR(100),
            address_state VARCHAR(2),
            address_zip_code VARCHAR(10),
            department_id UUID,
            position_id UUID,
            cost_center_id UUID,
            manager_id UUID,
            hire_date DATE NOT NULL,
            termination_date DATE,
            employment_type VARCHAR(30),
            work_regime VARCHAR(30),
            weekly_hours INTEGER,
            shift VARCHAR(50),
            base_salary DECIMAL(15,2),
            salary_type VARCHAR(20),
            status VARCHAR(20), -- ACTIVE, INACTIVE, TERMINATED
            is_active BOOLEAN,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )

        -- TABELA: shared.departments (Departamentos)
        shared.departments (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            code VARCHAR(20),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            parent_id UUID,
            manager_id UUID,
            is_active BOOLEAN,
            created_at TIMESTAMP
        )

        -- TABELA: shared.positions (Cargos)
        shared.positions (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            code VARCHAR(20),
            title VARCHAR(100) NOT NULL,
            description TEXT,
            salary_range_min DECIMAL(15,2),
            salary_range_max DECIMAL(15,2),
            level VARCHAR(20),
            department_id UUID,
            is_active BOOLEAN,
            created_at TIMESTAMP
        )

        -- TABELA: shared.cost_centers (Centros de Custo)
        shared.cost_centers (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            code VARCHAR(20),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            parent_id UUID,
            is_active BOOLEAN,
            created_at TIMESTAMP
        )
        """;

    /**
     * Process a natural language modification command.
     */
    @Transactional
    public DataModificationResponse processModificationCommand(
            String command,
            UUID tenantId,
            UUID userId,
            String conversationId,
            Map<String, Object> context) {

        log.info("Processing modification command: '{}' for tenant: {}, user: {}", command, tenantId, userId);

        try {
            // Step 1: Analyze the command using LLM
            String analysisResult = analyzeCommand(command, context);
            JsonNode analysis = objectMapper.readTree(analysisResult);

            log.debug("Command analysis result: {}", analysisResult);

            // Step 2: Validate the target entity exists
            ValidationResult validation = validateTargetEntity(analysis, tenantId);
            if (!validation.isValid()) {
                return createErrorResponse(validation.getError());
            }

            // Step 3: Fetch original data for comparison
            Map<String, Object> originalData = fetchOriginalData(analysis, validation.getEntityId(), tenantId);

            // Step 4: Create pending operation
            PendingOperation operation = createPendingOperation(
                    analysis, command, tenantId, userId, conversationId,
                    validation.getEntityId(), validation.getEntityName(), originalData);

            // Step 5: Save and return response
            PendingOperation saved = operationRepository.save(operation);
            log.info("Created pending operation: {} for entity: {}", saved.getId(), validation.getEntityName());

            return buildSuccessResponse(saved, validation.getEntityName());

        } catch (Exception e) {
            log.error("Error processing modification command: {}", e.getMessage(), e);
            return createErrorResponse("Não foi possível processar o comando: " + e.getMessage());
        }
    }

    /**
     * Analyze the command using LLM.
     */
    private String analyzeCommand(String command, Map<String, Object> context) {
        String prompt = MODIFICATION_ANALYSIS_PROMPT
                .replace("{schema}", DATABASE_SCHEMA)
                .replace("{command}", command)
                .replace("{context}", context != null ? context.toString() : "{}");

        ChatRequest request = ChatRequest.builder()
                .messages(List.of(
                        ChatMessage.builder()
                                .role(ChatMessage.Role.SYSTEM)
                                .content(prompt)
                                .build()
                ))
                .temperature(0.1)
                .build();

        ChatResponse response = llmService.chat(request);
        return extractJson(response.getContent());
    }

    /**
     * Validate that the target entity exists.
     */
    private ValidationResult validateTargetEntity(JsonNode analysis, UUID tenantId) {
        try {
            if (!analysis.has("validation_query")) {
                return ValidationResult.invalid("Não foi possível identificar o registro a ser modificado.");
            }

            String validationQuery = analysis.get("validation_query").asText();
            Map<String, Object> validationParams = new HashMap<>();
            validationParams.put("tenant_id", tenantId);

            if (analysis.has("validation_params")) {
                analysis.get("validation_params").fields().forEachRemaining(entry -> {
                    validationParams.put(entry.getKey(), entry.getValue().asText());
                });
            }

            // Fallback: Ensure search_value is available if referenced in query but missing in params
            if (!validationParams.containsKey("search_value")) {
                if (analysis.has("entity_identifier") && analysis.get("entity_identifier").has("search_value")) {
                    String value = analysis.get("entity_identifier").get("search_value").asText();
                    String type = analysis.get("entity_identifier").path("search_type").asText("CONTAINS");

                    if ("CONTAINS".equalsIgnoreCase(type) && !value.contains("%")) {
                        value = "%" + value + "%";
                    } else if ("STARTS_WITH".equalsIgnoreCase(type) && !value.endsWith("%")) {
                        value = value + "%";
                    }
                    validationParams.put("search_value", value);
                } else if (analysis.has("parameters") && analysis.get("parameters").has("search_value")) {
                     validationParams.put("search_value", analysis.get("parameters").get("search_value").asText());
                }
            }

            log.debug("Executing validation query: {} with params: {}", validationQuery, validationParams);

            List<Map<String, Object>> results = jdbcTemplate.queryForList(validationQuery, validationParams);

            if (results.isEmpty()) {
                String searchValue = analysis.path("entity_identifier").path("search_value").asText("");
                return ValidationResult.invalid(
                        String.format("Não foi encontrado nenhum registro com '%s'. Verifique se o nome está correto.", searchValue));
            }

            if (results.size() > 1) {
                StringBuilder message = new StringBuilder("Foram encontrados múltiplos registros. Seja mais específico:\n");
                for (Map<String, Object> row : results) {
                    String name = row.getOrDefault("full_name", row.getOrDefault("name", row.getOrDefault("title", "N/A"))).toString();
                    message.append("- ").append(name).append("\n");
                }
                return ValidationResult.invalid(message.toString());
            }

            Map<String, Object> record = results.get(0);
            UUID entityId = UUID.fromString(record.get("id").toString());
            String entityName = record.getOrDefault("full_name",
                    record.getOrDefault("name",
                            record.getOrDefault("title", "Registro"))).toString();

            return ValidationResult.valid(entityId, entityName);

        } catch (Exception e) {
            log.error("Validation error: {}", e.getMessage(), e);
            return ValidationResult.invalid("Erro ao validar o registro: " + e.getMessage());
        }
    }

    /**
     * Fetch original data for the entity.
     */
    private Map<String, Object> fetchOriginalData(JsonNode analysis, UUID entityId, UUID tenantId) {
        try {
            String targetTable = analysis.get("target_table").asText();
            String query = String.format("SELECT * FROM %s WHERE id = :id AND tenant_id = :tenant_id", targetTable);

            List<Map<String, Object>> results = jdbcTemplate.queryForList(query,
                    Map.of("id", entityId, "tenant_id", tenantId));

            return results.isEmpty() ? Map.of() : results.get(0);

        } catch (Exception e) {
            log.warn("Could not fetch original data: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Create a pending operation entity.
     */
    private PendingOperation createPendingOperation(
            JsonNode analysis,
            String command,
            UUID tenantId,
            UUID userId,
            String conversationId,
            UUID entityId,
            String entityName,
            Map<String, Object> originalData) {

        OperationType operationType = OperationType.valueOf(
                analysis.get("operation_type").asText("UPDATE"));

        RiskLevel riskLevel = RiskLevel.valueOf(
                analysis.get("risk_level").asText("MEDIUM"));

        // Extract changes
        List<DataChange> changes = new ArrayList<>();
        if (analysis.has("changes")) {
            for (JsonNode change : analysis.get("changes")) {
                String field = change.get("field").asText();
                Object oldValue = originalData.get(field);

                changes.add(DataChange.builder()
                        .field(field)
                        .fieldLabel(change.get("field_label").asText())
                        .oldValue(oldValue)
                        .newValue(change.has("new_value") && !change.get("new_value").isNull()
                                ? change.get("new_value").asText() : null)
                        .changeType(change.get("change_type").asText("UPDATE"))
                        .build());
            }
        }

        // Extract SQL and parameters
        String sql = analysis.get("sql").asText();
        Map<String, Object> sqlParams = new HashMap<>();
        if (analysis.has("parameters")) {
            analysis.get("parameters").fields().forEachRemaining(entry -> {
                JsonNode value = entry.getValue();
                if (value.isNumber()) {
                    sqlParams.put(entry.getKey(), value.numberValue());
                } else if (value.isBoolean()) {
                    sqlParams.put(entry.getKey(), value.booleanValue());
                } else {
                    sqlParams.put(entry.getKey(), value.asText());
                }
            });
        }

        // Add search_value fallback if used in SQL but missing from parameters
        if (!sqlParams.containsKey("search_value")) {
            if (analysis.has("validation_params") && analysis.get("validation_params").has("search_value")) {
                sqlParams.put("search_value", analysis.get("validation_params").get("search_value").asText());
            } else if (analysis.has("entity_identifier") && analysis.get("entity_identifier").has("search_value")) {
                sqlParams.put("search_value", analysis.get("entity_identifier").get("search_value").asText());
            }
        }
        sqlParams.put("entity_id", entityId);

        // Build new data map
        Map<String, Object> newData = new HashMap<>();
        for (DataChange change : changes) {
            newData.put(change.getField(), change.getNewValue());
        }

        // Generate rollback SQL for updates
        String rollbackSql = generateRollbackSql(analysis, originalData, entityId);

        return PendingOperation.builder()
                .tenantId(tenantId)
                .userId(userId)
                .conversationId(conversationId)
                .operationType(operationType)
                .status(OperationStatus.PENDING)
                .targetTable(analysis.get("target_table").asText())
                .targetEntity(analysis.get("target_entity").asText())
                .targetId(entityId)
                .description(analysis.get("description").asText())
                .naturalLanguageRequest(command)
                .originalData(originalData)
                .newData(newData)
                .changesSummary(changes)
                .generatedSql(sql)
                .sqlParameters(sqlParams)
                .affectedRecordsCount(1)
                .riskLevel(riskLevel)
                .requiresApproval(true)
                .rollbackSql(rollbackSql)
                .expiresAt(Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES))
                .createdBy(userId)
                .metadata(Map.of(
                        "entityName", entityName,
                        "confirmationMessage", analysis.has("confirmation_message")
                                ? analysis.get("confirmation_message").asText()
                                : "Deseja confirmar esta operação?",
                        "warning", analysis.has("warning")
                                ? analysis.get("warning").asText()
                                : null
                ))
                .build();
    }

    /**
     * Generate rollback SQL for the operation.
     */
    private String generateRollbackSql(JsonNode analysis, Map<String, Object> originalData, UUID entityId) {
        String operationType = analysis.get("operation_type").asText();
        String targetTable = analysis.get("target_table").asText();

        if ("UPDATE".equals(operationType) && !originalData.isEmpty()) {
            StringBuilder sb = new StringBuilder("UPDATE ");
            sb.append(targetTable).append(" SET ");

            List<String> setClauses = new ArrayList<>();
            if (analysis.has("changes")) {
                for (JsonNode change : analysis.get("changes")) {
                    String field = change.get("field").asText();
                    Object oldValue = originalData.get(field);
                    if (oldValue != null) {
                        setClauses.add(String.format("%s = '%s'", field, oldValue.toString().replace("'", "''")));
                    } else {
                        setClauses.add(String.format("%s = NULL", field));
                    }
                }
            }

            sb.append(String.join(", ", setClauses));
            sb.append(" WHERE id = '").append(entityId).append("'");
            return sb.toString();
        }

        return null;
    }

    /**
     * Build success response.
     */
    private DataModificationResponse buildSuccessResponse(PendingOperation operation, String entityName) {
        @SuppressWarnings("unchecked")
        Map<String, Object> metadata = operation.getMetadata();

        return DataModificationResponse.builder()
                .operationId(operation.getId())
                .operationType(operation.getOperationType())
                .status(operation.getStatus())
                .riskLevel(operation.getRiskLevel())
                .targetTable(operation.getTargetTable())
                .targetEntity(operation.getTargetEntity())
                .targetEntityName(entityName)
                .targetId(operation.getTargetId())
                .description(operation.getDescription())
                .confirmationMessage(metadata != null ? (String) metadata.get("confirmationMessage") : null)
                .warningMessage(metadata != null ? (String) metadata.get("warning") : null)
                .changes(operation.getChangesSummary().stream()
                        .map(dc -> DataModificationResponse.ChangePreview.builder()
                                .fieldName(dc.getField())
                                .fieldLabel(dc.getFieldLabel())
                                .oldValue(dc.getOldValue() != null ? dc.getOldValue().toString() : null)
                                .newValue(dc.getNewValue() != null ? dc.getNewValue().toString() : null)
                                .changeType(dc.getChangeType())
                                .isSensitive(isSensitiveField(dc.getField()))
                                .build())
                        .toList())
                .affectedRecordsCount(operation.getAffectedRecordsCount())
                .expiresAt(operation.getExpiresAt())
                .createdAt(operation.getCreatedAt())
                .requiresConfirmation(true)
                .metadata(operation.getMetadata())
                .build();
    }

    /**
     * Create error response.
     */
    private DataModificationResponse createErrorResponse(String error) {
        return DataModificationResponse.builder()
                .status(OperationStatus.FAILED)
                .requiresConfirmation(false)
                .description(error)
                .confirmationMessage(error)
                .build();
    }

    /**
     * Check if a field is sensitive.
     */
    private boolean isSensitiveField(String field) {
        return List.of("cpf", "base_salary", "bank_account", "pix_key", "password").contains(field.toLowerCase());
    }

    /**
     * Extract JSON from LLM response.
     */
    private String extractJson(String content) {
        if (content == null) return "{}";

        String result = content.trim();

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
        int startIndex = result.indexOf("{");
        if (startIndex == -1) return "{}";

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
                if (c == '{') balance++;
                else if (c == '}') {
                    balance--;
                    if (balance == 0) {
                        return result.substring(startIndex, i + 1);
                    }
                }
            }
        }

        return "{}";
    }

    /**
     * Result of entity validation.
     */
    private record ValidationResult(boolean valid, UUID entityId, String entityName, String error) {
        static ValidationResult valid(UUID entityId, String entityName) {
            return new ValidationResult(true, entityId, entityName, null);
        }

        static ValidationResult invalid(String error) {
            return new ValidationResult(false, null, null, error);
        }

        boolean isValid() {
            return valid;
        }

        String getError() {
            return error;
        }

        UUID getEntityId() {
            return entityId;
        }

        String getEntityName() {
            return entityName;
        }
    }
}
