package com.axonrh.payroll.listener;

import com.axonrh.kafka.event.DomainEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmployeeEventListener {

    @KafkaListener(topics = "employee.domain.events", groupId = "payroll-service")
    public void handleEmployeeEvent(DomainEvent event) {
        log.info("Evento recebido do employee-service: type={}, aggregateId={}",
                event.getEventType(), event.getAggregateId());

        switch (event.getEventType()) {
            case "EMPLOYEE_TERMINATED":
                log.info("Colaborador {} desligado - nenhuma acao necessaria na folha atual",
                        event.getAggregateId());
                break;
            case "EMPLOYEE_SALARY_UPDATED":
                log.info("Salario atualizado para colaborador {} - sera considerado no proximo calculo",
                        event.getAggregateId());
                break;
            default:
                log.debug("Evento ignorado: {}", event.getEventType());
        }
    }
}
