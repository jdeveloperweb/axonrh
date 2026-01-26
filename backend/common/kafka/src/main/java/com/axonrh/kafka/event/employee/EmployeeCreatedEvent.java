package com.axonrh.kafka.event.employee;

import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Evento emitido quando um colaborador e criado.
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeCreatedEvent extends EmployeeEvent {

    private static final String EVENT_TYPE = "EMPLOYEE_CREATED";

    private String cpf;
    private String fullName;
    private String email;
    private LocalDate birthDate;
    private LocalDate hireDate;
    private UUID departmentId;
    private String departmentName;
    private UUID positionId;
    private String positionName;
    private String employmentType;

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }

    public static EmployeeCreatedEventBuilder<?, ?> create() {
        return EmployeeCreatedEvent.builder()
                .eventType(EVENT_TYPE)
                .schemaVersion(1);
    }
}
