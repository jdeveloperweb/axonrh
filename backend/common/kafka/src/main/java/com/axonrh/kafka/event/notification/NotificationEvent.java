package com.axonrh.kafka.event.notification;

import com.axonrh.kafka.event.DomainEvent;
import com.axonrh.kafka.topic.KafkaTopics;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Evento para envio de notificacoes.
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent extends DomainEvent {

    private static final String EVENT_TYPE = "NOTIFICATION_REQUESTED";

    /**
     * Tipo de notificacao (EMAIL, PUSH, SMS, IN_APP).
     */
    private List<String> channels;

    /**
     * Template da notificacao.
     */
    private String templateCode;

    /**
     * Destinatarios (user IDs).
     */
    private List<UUID> recipientIds;

    /**
     * Emails externos (para notificacoes a nao-usuarios).
     */
    private List<String> externalEmails;

    /**
     * Titulo/assunto.
     */
    private String title;

    /**
     * Corpo da mensagem (pode conter placeholders).
     */
    private String body;

    /**
     * Variaveis para substituicao no template.
     */
    private Map<String, Object> variables;

    /**
     * Prioridade (LOW, NORMAL, HIGH, URGENT).
     */
    private String priority;

    /**
     * URL de acao (link no email/push).
     */
    private String actionUrl;

    /**
     * Se deve ser agendada para envio posterior.
     */
    private java.time.Instant scheduledFor;

    @Override
    public String getTopicName() {
        return KafkaTopics.NOTIFICATION_EVENTS;
    }

    @Override
    public String getAggregateType() {
        return "Notification";
    }

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }

    public static NotificationEventBuilder<?> create() {
        return NotificationEvent.builder()
                .eventType(EVENT_TYPE)
                .schemaVersion(1);
    }
}
