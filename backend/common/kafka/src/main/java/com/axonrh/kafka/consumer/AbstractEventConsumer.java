package com.axonrh.kafka.consumer;

import com.axonrh.kafka.event.DomainEvent;
import com.axonrh.kafka.producer.DomainEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.support.Acknowledgment;

/**
 * Classe base abstrata para consumidores de eventos.
 * Fornece tratamento padronizado de erros e logging.
 */
@Slf4j
@RequiredArgsConstructor
public abstract class AbstractEventConsumer<T extends DomainEvent> {

    protected final DomainEventPublisher eventPublisher;

    /**
     * Processa o record recebido com tratamento de erros.
     */
    protected void processRecord(ConsumerRecord<String, T> record, Acknowledgment ack) {
        T event = record.value();

        log.debug("Recebido evento: topic={}, partition={}, offset={}, eventId={}, type={}",
                record.topic(),
                record.partition(),
                record.offset(),
                event.getEventId(),
                event.getEventType());

        try {
            // Valida evento
            validateEvent(event);

            // Processa evento
            handleEvent(event);

            // Confirma processamento
            ack.acknowledge();

            log.debug("Evento processado com sucesso: eventId={}", event.getEventId());

        } catch (Exception e) {
            handleError(event, e, record, ack);
        }
    }

    /**
     * Metodo abstrato para processamento do evento.
     * Deve ser implementado pelas classes filhas.
     */
    protected abstract void handleEvent(T event) throws Exception;

    /**
     * Validacao basica do evento.
     * Pode ser sobrescrito para validacoes adicionais.
     */
    protected void validateEvent(T event) {
        if (event.getEventId() == null) {
            throw new IllegalArgumentException("EventId nao pode ser nulo");
        }
        if (event.getEventType() == null) {
            throw new IllegalArgumentException("EventType nao pode ser nulo");
        }
    }

    /**
     * Tratamento de erro padrao.
     * Envia para DLQ apos falha.
     */
    protected void handleError(T event, Exception e, ConsumerRecord<String, T> record, Acknowledgment ack) {
        log.error("Erro ao processar evento: eventId={}, type={}, error={}",
                event.getEventId(), event.getEventType(), e.getMessage(), e);

        try {
            // Envia para DLQ
            eventPublisher.publishToDlq(event, "PROCESSING_ERROR", e);

            // Confirma para nao reprocessar infinitamente
            ack.acknowledge();

            log.warn("Evento enviado para DLQ: eventId={}", event.getEventId());

        } catch (Exception dlqError) {
            log.error("Falha ao enviar evento para DLQ: eventId={}, error={}",
                    event.getEventId(), dlqError.getMessage());

            // Nao confirma para permitir retry pelo Kafka
            throw new RuntimeException("Falha no processamento e no envio para DLQ", dlqError);
        }
    }

    /**
     * Verifica se o evento e de um tipo especifico.
     */
    protected boolean isEventType(DomainEvent event, String eventType) {
        return eventType.equals(event.getEventType());
    }

    /**
     * Extrai header como String.
     */
    protected String getHeader(ConsumerRecord<String, ?> record, String headerName) {
        var header = record.headers().lastHeader(headerName);
        return header != null ? new String(header.value()) : null;
    }
}
