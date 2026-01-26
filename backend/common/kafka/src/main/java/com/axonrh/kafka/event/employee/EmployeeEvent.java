package com.axonrh.kafka.event.employee;

import com.axonrh.kafka.event.DomainEvent;
import com.axonrh.kafka.topic.KafkaTopics;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Classe base para eventos de colaboradores.
 */
@Getter
@SuperBuilder
@NoArgsConstructor
public abstract class EmployeeEvent extends DomainEvent {

    @Override
    public String getTopicName() {
        return KafkaTopics.EMPLOYEE_DOMAIN_EVENTS;
    }

    @Override
    public String getAggregateType() {
        return "Employee";
    }
}
