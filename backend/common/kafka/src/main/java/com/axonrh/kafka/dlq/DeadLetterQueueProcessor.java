package com.axonrh.kafka.dlq;

import com.axonrh.kafka.event.DomainEvent;
import com.axonrh.kafka.topic.KafkaTopics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * T092 - Processador de Dead Letter Queue.
 * Mensagens que falharam sao armazenadas para analise e reprocessamento.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DeadLetterQueueProcessor {

    private final DeadLetterRepository deadLetterRepository;

    @KafkaListener(
            topics = KafkaTopics.DEAD_LETTER_QUEUE,
            groupId = "dlq-processor",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void processDlqMessage(ConsumerRecord<String, DomainEvent> record, Acknowledgment ack) {
        DomainEvent event = record.value();

        String reason = getHeaderValue(record, "dlq.reason");
        String originalTopic = getHeaderValue(record, "dlq.original-topic");
        String exception = getHeaderValue(record, "dlq.exception");

        log.warn("DLQ: Recebida mensagem falha - eventId={}, type={}, originalTopic={}, reason={}",
                event.getEventId(), event.getEventType(), originalTopic, reason);

        try {
            // Persiste para analise posterior
            DeadLetterEntry entry = DeadLetterEntry.builder()
                    .eventId(event.getEventId())
                    .eventType(event.getEventType())
                    .originalTopic(originalTopic)
                    .tenantId(event.getTenantId())
                    .aggregateId(event.getAggregateId())
                    .payload(event)
                    .failureReason(reason)
                    .exceptionMessage(exception)
                    .retryCount(0)
                    .status(DeadLetterStatus.PENDING)
                    .build();

            deadLetterRepository.save(entry);

            log.info("DLQ: Mensagem persistida para analise - eventId={}", event.getEventId());

            ack.acknowledge();

        } catch (Exception e) {
            log.error("DLQ: Erro ao persistir mensagem - eventId={}, error={}",
                    event.getEventId(), e.getMessage());
            // Nao confirma para permitir retry
        }
    }

    private String getHeaderValue(ConsumerRecord<String, ?> record, String headerName) {
        var header = record.headers().lastHeader(headerName);
        return header != null ? new String(header.value()) : null;
    }
}
