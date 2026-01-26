package com.axonrh.kafka.producer;

import com.axonrh.kafka.event.DomainEvent;
import com.axonrh.kafka.topic.KafkaTopics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;

/**
 * Publisher centralizado para eventos de dominio.
 * Fornece metodos convenientes para publicacao com headers e rastreamento.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DomainEventPublisher {

    private final KafkaTemplate<String, DomainEvent> kafkaTemplate;

    /**
     * Publica evento no topic correspondente.
     * O topic e determinado pelo evento.
     */
    public CompletableFuture<SendResult<String, DomainEvent>> publish(DomainEvent event) {
        return publish(event.getTopicName(), event);
    }

    /**
     * Publica evento em topic especifico.
     */
    public CompletableFuture<SendResult<String, DomainEvent>> publish(String topic, DomainEvent event) {
        String key = determineKey(event);

        ProducerRecord<String, DomainEvent> record = new ProducerRecord<>(topic, key, event);

        // Adiciona headers de rastreamento
        addHeaders(record, event);

        log.debug("Publicando evento: topic={}, key={}, type={}, eventId={}",
                topic, key, event.getEventType(), event.getEventId());

        return kafkaTemplate.send(record)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Erro ao publicar evento: topic={}, eventId={}, error={}",
                                topic, event.getEventId(), ex.getMessage());
                    } else {
                        log.info("Evento publicado: topic={}, partition={}, offset={}, eventId={}",
                                topic,
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset(),
                                event.getEventId());
                    }
                });
    }

    /**
     * Publica evento de forma sincrona (aguarda confirmacao).
     */
    public SendResult<String, DomainEvent> publishSync(DomainEvent event) {
        try {
            return publish(event).get();
        } catch (Exception e) {
            log.error("Erro ao publicar evento de forma sincrona: {}", e.getMessage());
            throw new RuntimeException("Falha ao publicar evento", e);
        }
    }

    /**
     * Publica evento para Dead Letter Queue.
     */
    public CompletableFuture<SendResult<String, DomainEvent>> publishToDlq(
            DomainEvent event, String reason, Exception originalException) {

        ProducerRecord<String, DomainEvent> record =
                new ProducerRecord<>(KafkaTopics.DEAD_LETTER_QUEUE, determineKey(event), event);

        record.headers()
                .add(new RecordHeader("dlq.reason", reason.getBytes(StandardCharsets.UTF_8)))
                .add(new RecordHeader("dlq.original-topic",
                        event.getTopicName().getBytes(StandardCharsets.UTF_8)));

        if (originalException != null) {
            record.headers().add(new RecordHeader("dlq.exception",
                    originalException.getMessage().getBytes(StandardCharsets.UTF_8)));
        }

        log.warn("Enviando evento para DLQ: eventId={}, reason={}", event.getEventId(), reason);

        return kafkaTemplate.send(record);
    }

    /**
     * Determina a chave de particao do evento.
     * Usa aggregateId para garantir ordenacao de eventos do mesmo agregado.
     */
    private String determineKey(DomainEvent event) {
        if (event.getAggregateId() != null) {
            return event.getAggregateId().toString();
        }
        if (event.getTenantId() != null) {
            return event.getTenantId().toString();
        }
        return event.getEventId().toString();
    }

    /**
     * Adiciona headers de rastreamento ao record.
     */
    private void addHeaders(ProducerRecord<String, DomainEvent> record, DomainEvent event) {
        if (event.getCorrelationId() != null) {
            record.headers().add(new RecordHeader("correlationId",
                    event.getCorrelationId().getBytes(StandardCharsets.UTF_8)));
        }

        if (event.getCausationId() != null) {
            record.headers().add(new RecordHeader("causationId",
                    event.getCausationId().getBytes(StandardCharsets.UTF_8)));
        }

        if (event.getTenantId() != null) {
            record.headers().add(new RecordHeader("tenantId",
                    event.getTenantId().toString().getBytes(StandardCharsets.UTF_8)));
        }

        record.headers().add(new RecordHeader("eventType",
                event.getEventType().getBytes(StandardCharsets.UTF_8)));

        record.headers().add(new RecordHeader("schemaVersion",
                event.getSchemaVersion().toString().getBytes(StandardCharsets.UTF_8)));
    }
}
