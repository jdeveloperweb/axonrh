package com.axonrh.kafka.event;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

/**
 * Classe base para todos os eventos de dominio.
 * Segue padrao de Event Sourcing com metadados de rastreamento.
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, property = "@class")
public abstract class DomainEvent {

    /**
     * Identificador unico do evento.
     */
    private UUID eventId;

    /**
     * Tipo do evento (ex: "EMPLOYEE_CREATED", "TIMESHEET_REGISTERED").
     */
    private String eventType;

    /**
     * Versao do schema do evento para compatibilidade.
     */
    private Integer schemaVersion;

    /**
     * ID do agregado/entidade que gerou o evento.
     */
    private UUID aggregateId;

    /**
     * Tipo do agregado (ex: "Employee", "Timesheet").
     */
    private String aggregateType;

    /**
     * ID do tenant (multi-tenancy).
     */
    private UUID tenantId;

    /**
     * ID do usuario que causou o evento.
     */
    private UUID userId;

    /**
     * Correlation ID para rastreamento distribuido.
     */
    private String correlationId;

    /**
     * Causation ID - ID do evento/comando que causou este evento.
     */
    private String causationId;

    /**
     * Timestamp de criacao do evento.
     */
    private Instant timestamp;

    /**
     * Metadados adicionais opcionais.
     */
    private java.util.Map<String, Object> metadata;

    /**
     * Inicializa campos obrigatorios se nao fornecidos.
     */
    protected void initializeDefaults() {
        if (this.eventId == null) {
            this.eventId = UUID.randomUUID();
        }
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
        if (this.schemaVersion == null) {
            this.schemaVersion = 1;
        }
        if (this.correlationId == null) {
            this.correlationId = UUID.randomUUID().toString();
        }
    }

    /**
     * Retorna o nome do topic Kafka para este evento.
     */
    @JsonIgnore
    public abstract String getTopicName();
}
