package com.axonrh.timesheet.kafka;

import com.axonrh.timesheet.service.DailySummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class LeaveEventsListener {

    private final DailySummaryService dailySummaryService;

    @KafkaListener(topics = "vacation.domain.events", groupId = "timesheet-service")
    public void handleLeaveEvent(Map<String, Object> event) {
        String eventType = (String) event.get("eventType");
        log.info("Evento de licença recebido: {}", eventType);

        if ("LEAVE_APPROVED".equals(eventType)) {
            try {
                UUID tenantId = UUID.fromString((String) event.get("tenantId"));
                UUID employeeId = UUID.fromString((String) event.get("employeeId"));
                LocalDate startDate = LocalDate.parse((String) event.get("startDate"));
                LocalDate endDate = LocalDate.parse((String) event.get("endDate"));
                String leaveType = (String) event.get("type");

                dailySummaryService.handleApprovedLeave(tenantId, employeeId, startDate, endDate, leaveType);
            } catch (Exception e) {
                log.error("Erro ao processar evento LEAVE_APPROVED: {}", e.getMessage(), e);
            }
        }
    }
}
