package com.axonrh.benefits.listener;

import com.axonrh.kafka.event.DomainEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmployeeEventListener {

    @KafkaListener(topics = "employee.domain.events", groupId = "benefits-service")
    public void handleEmployeeEvent(DomainEvent event) {
        log.info("Evento recebido: type={}, aggregateId={}",
                event.getEventType(), event.getAggregateId());

        switch (event.getEventType()) {
            case "EMPLOYEE_TERMINATED":
                log.info("Colaborador {} desligado - beneficios serao desativados no proximo processamento",
                        event.getAggregateId());
                break;
            case "EMPLOYEE_SALARY_UPDATED":
                log.info("Salario do colaborador {} atualizado - beneficios percentuais serao recalculados",
                        event.getAggregateId());
                break;
            default:
                log.debug("Evento ignorado: {}", event.getEventType());
        }
    }
}
