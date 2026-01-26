package com.axonrh.kafka.event.timesheet;

import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Evento emitido quando colaborador registra entrada.
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class ClockInEvent extends TimesheetEvent {

    private static final String EVENT_TYPE = "CLOCK_IN";

    private LocalDate workDate;
    private Instant clockInTime;
    private String registrationMethod; // MANUAL, BIOMETRIC, FACIAL, GEOLOCATION
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String deviceId;
    private String ipAddress;
    private Boolean isLate;
    private Integer lateMinutes;

    @Override
    public String getEventType() {
        return EVENT_TYPE;
    }

    public static ClockInEventBuilder<?> create() {
        return ClockInEvent.builder()
                .eventType(EVENT_TYPE)
                .schemaVersion(1);
    }
}
