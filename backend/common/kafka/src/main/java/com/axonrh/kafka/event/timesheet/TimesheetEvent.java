package com.axonrh.kafka.event.timesheet;

import com.axonrh.kafka.event.DomainEvent;
import com.axonrh.kafka.topic.KafkaTopics;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Classe base para eventos de ponto.
 */
@Getter
@SuperBuilder
@NoArgsConstructor
public abstract class TimesheetEvent extends DomainEvent {

    /**
     * ID do colaborador.
     */
    protected UUID employeeId;

    @Override
    public String getTopicName() {
        return KafkaTopics.TIMESHEET_DOMAIN_EVENTS;
    }

    @Override
    public String getAggregateType() {
        return "Timesheet";
    }
}
