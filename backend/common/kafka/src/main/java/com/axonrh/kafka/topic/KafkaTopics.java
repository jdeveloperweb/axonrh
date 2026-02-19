package com.axonrh.kafka.topic;

/**
 * Constantes com nomes dos topics Kafka.
 * Centralizadas para evitar erros de digitacao.
 */
public final class KafkaTopics {

    private KafkaTopics() {
        // Utility class
    }

    // ==================== Domain Events ====================

    /**
     * T085 - Eventos de dominio de colaboradores (6 particoes).
     */
    public static final String EMPLOYEE_DOMAIN_EVENTS = "employee.domain.events";

    /**
     * T086 - Eventos de ponto (12 particoes - maior volume).
     */
    public static final String TIMESHEET_DOMAIN_EVENTS = "timesheet.domain.events";

    /**
     * Eventos de ferias.
     */
    public static final String VACATION_DOMAIN_EVENTS = "vacation.domain.events";

    /**
     * Eventos de desempenho.
     */
    public static final String PERFORMANCE_DOMAIN_EVENTS = "performance.domain.events";

    /**
     * Eventos de treinamentos.
     */
    public static final String LEARNING_DOMAIN_EVENTS = "learning.domain.events";

    /**
     * Eventos de beneficios.
     */
    public static final String BENEFITS_DOMAIN_EVENTS = "benefits.domain.events";

    /**
     * Eventos de contratacao digital (6 particoes).
     */
    public static final String DIGITAL_HIRING_DOMAIN_EVENTS = "digital-hiring.domain.events";

    // ==================== System Events ====================

    /**
     * T087 - Logs de consultas ao assistente IA (6 particoes).
     */
    public static final String AI_QUERY_LOGS = "ai.query.logs";

    /**
     * T088 - Eventos de notificacoes (6 particoes).
     */
    public static final String NOTIFICATION_EVENTS = "notification.events";

    /**
     * T089 - Eventos de auditoria (6 particoes).
     */
    public static final String AUDIT_EVENTS = "audit.events";

    // ==================== Infrastructure ====================

    /**
     * Dead Letter Queue para mensagens que falharam.
     */
    public static final String DEAD_LETTER_QUEUE = "axonrh.dlq";

    /**
     * Topic de comandos.
     */
    public static final String COMMANDS = "axonrh.commands";

    // ==================== Consumer Groups ====================

    public static final String EMPLOYEE_SERVICE_GROUP = "employee-service";
    public static final String TIMESHEET_SERVICE_GROUP = "timesheet-service";
    public static final String NOTIFICATION_SERVICE_GROUP = "notification-service";
    public static final String AUDIT_SERVICE_GROUP = "audit-service";
    public static final String AI_SERVICE_GROUP = "ai-service";
    public static final String ANALYTICS_SERVICE_GROUP = "analytics-service";
    public static final String BENEFITS_SERVICE_GROUP = "benefits-service";
}
