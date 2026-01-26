package com.axonrh.kafka.event.employee;

import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.Map;

/**
 * Evento emitido quando um colaborador e atualizado.
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeUpdatedEvent extends EmployeeEvent {

    private static final String EVENT_TYPE = "EMPLOYEE_UPDATED";

    /**
     * Campos que foram alterados (campo -> valor antigo).
     */
    private Map<String, Object> changedFields;

    /**
     * Novos valores dos campos alterados.
     */
    private Map<String, Object> newValues;

    /**
     * Motivo da alteracao.
     */
    private String changeReason;

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }

    public static EmployeeUpdatedEventBuilder<?> create() {
        return EmployeeUpdatedEvent.builder()
                .eventType(EVENT_TYPE)
                .schemaVersion(1);
    }
}
