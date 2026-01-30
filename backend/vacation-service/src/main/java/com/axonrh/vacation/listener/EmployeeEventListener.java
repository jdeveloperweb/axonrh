package com.axonrh.vacation.listener;

import com.axonrh.kafka.event.DomainEvent;
import com.axonrh.kafka.event.employee.EmployeeCreatedEvent;
import com.axonrh.kafka.topic.KafkaTopics;
import com.axonrh.vacation.service.VacationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmployeeEventListener {

    private final VacationService vacationService;

    @KafkaListener(topics = KafkaTopics.EMPLOYEE_DOMAIN_EVENTS, groupId = "vacation-service")
    public void handleEmployeeEvent(@Payload DomainEvent event) {
        log.debug("Evento recebido: type={}, id={}", event.getEventType(), event.getEventId());

        if (event instanceof EmployeeCreatedEvent employeeEvent) {
            handleEmployeeCreated(employeeEvent);
        }
    }

    private void handleEmployeeCreated(EmployeeCreatedEvent event) {
        log.info("Processando novo colaborador: {} (Tenant: {})", event.getFullName(), event.getTenantId());

        try {
            vacationService.createPeriod(
                    event.getTenantId(),
                    event.getAggregateId(),
                    event.getFullName(),
                    event.getHireDate() // Usar data de admissão
            );
            log.info("Periodo de ferias inicial criado com sucesso para: {}", event.getFullName());
        } catch (Exception e) {
            log.error("Erro ao criar periodo de ferias para colaborador: {}", event.getAggregateId(), e);
            // Dependendo da estratégia, poderia lançar exceção para DLQ/Retry
        }
    }
}
