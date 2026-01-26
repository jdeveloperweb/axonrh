package com.axonrh.kafka.event.audit;

import com.axonrh.kafka.event.DomainEvent;
import com.axonrh.kafka.topic.KafkaTopics;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.Map;

/**
 * Evento de auditoria para rastreamento de acoes.
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class AuditEvent extends DomainEvent {

    private static final String EVENT_TYPE = "AUDIT_LOG";

    /**
     * Acao realizada (CREATE, UPDATE, DELETE, READ, LOGIN, etc.).
     */
    private String action;

    /**
     * Recurso afetado (EMPLOYEE, TIMESHEET, etc.).
     */
    private String resource;

    /**
     * ID do recurso afetado.
     */
    private String resourceId;

    /**
     * Valores anteriores (em caso de UPDATE/DELETE).
     */
    private Map<String, Object> previousValues;

    /**
     * Novos valores (em caso de CREATE/UPDATE).
     */
    private Map<String, Object> newValues;

    /**
     * IP do cliente.
     */
    private String clientIp;

    /**
     * User Agent.
     */
    private String userAgent;

    /**
     * Resultado da acao (SUCCESS, FAILURE, DENIED).
     */
    private String result;

    /**
     * Mensagem de erro (em caso de falha).
     */
    private String errorMessage;

    /**
     * Duracao da operacao em milissegundos.
     */
    private Long durationMs;

    @Override
    public String getTopicName() {
        return KafkaTopics.AUDIT_EVENTS;
    }

    @Override
    public String getAggregateType() {
        return "Audit";
    }

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }

    public static AuditEventBuilder<?, ?> create() {
        return AuditEvent.builder()
                .eventType(EVENT_TYPE)
                .schemaVersion(1);
    }
}
