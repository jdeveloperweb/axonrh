package com.axonrh.kafka.dlq;

/**
 * Status de uma entrada na Dead Letter Queue.
 */
public enum DeadLetterStatus {

    /**
     * Aguardando analise.
     */
    PENDING,

    /**
     * Em processo de reprocessamento.
     */
    RETRYING,

    /**
     * Reprocessado com sucesso.
     */
    RESOLVED,

    /**
     * Descartado manualmente.
     */
    DISCARDED,

    /**
     * Falha permanente - nao sera reprocessado.
     */
    FAILED
}
