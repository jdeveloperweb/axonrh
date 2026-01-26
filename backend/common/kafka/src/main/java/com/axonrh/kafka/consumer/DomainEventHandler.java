package com.axonrh.kafka.consumer;

import com.axonrh.kafka.event.DomainEvent;

/**
 * Interface funcional para handlers de eventos de dominio.
 *
 * @param <T> Tipo do evento
 */
@FunctionalInterface
public interface DomainEventHandler<T extends DomainEvent> {

    /**
     * Processa o evento recebido.
     *
     * @param event O evento a ser processado
     * @throws Exception Se ocorrer erro no processamento
     */
    void handle(T event) throws Exception;
}
