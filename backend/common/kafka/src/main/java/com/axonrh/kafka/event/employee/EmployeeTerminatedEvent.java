package com.axonrh.kafka.event.employee;

import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Evento emitido quando um colaborador e desligado.
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTerminatedEvent extends EmployeeEvent {

    private static final String EVENT_TYPE = "EMPLOYEE_TERMINATED";

    private LocalDate terminationDate;
    private String terminationType; // RESIGNATION, DISMISSAL, RETIREMENT, etc.
    private String terminationReason;
    private BigDecimal severancePay;
    private Boolean requiresNoticeWorked;
    private Integer noticePeriodDays;

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }

    public static EmployeeTerminatedEventBuilder<?> create() {
        return EmployeeTerminatedEvent.builder()
                .eventType(EVENT_TYPE)
                .schemaVersion(1);
    }
}
