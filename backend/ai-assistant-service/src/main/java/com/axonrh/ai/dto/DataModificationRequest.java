package com.axonrh.ai.dto;

import com.axonrh.ai.entity.PendingOperation.OperationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * Request DTO for data modification operations via natural language.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataModificationRequest {

    /**
     * The natural language command describing the modification.
     * Examples:
     * - "Alterar o nome do João Silva para João Santos"
     * - "Mudar o salário da Maria para R$ 5.000"
     * - "Atualizar o departamento do Pedro para TI"
     * - "Adicionar novo funcionário chamado Carlos"
     */
    private String command;

    /**
     * Optional: Specific operation type if known.
     */
    private OperationType operationType;

    /**
     * Optional: Target entity type (employee, department, etc.).
     */
    private String entityType;

    /**
     * Optional: Specific entity ID if known.
     */
    private UUID entityId;

    /**
     * Optional: Additional context or parameters.
     */
    private Map<String, Object> context;

    /**
     * Conversation ID for context tracking.
     */
    private String conversationId;
}
