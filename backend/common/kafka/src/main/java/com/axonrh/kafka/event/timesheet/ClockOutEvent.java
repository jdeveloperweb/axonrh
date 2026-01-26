package com.axonrh.kafka.event.timesheet;

import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Evento emitido quando colaborador registra saida.
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class ClockOutEvent extends TimesheetEvent {

    private static final String EVENT_TYPE = "CLOCK_OUT";

    private LocalDate workDate;
    private Instant clockOutTime;
    private String registrationMethod;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String deviceId;
    private String ipAddress;
    private Long workedMinutes;
    private Long overtimeMinutes;
    private Boolean earlyLeave;
    private Integer earlyLeaveMinutes;

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }

    public static ClockOutEventBuilder<?> create() {
        return ClockOutEvent.builder()
                .eventType(EVENT_TYPE)
                .schemaVersion(1);
    }
}
