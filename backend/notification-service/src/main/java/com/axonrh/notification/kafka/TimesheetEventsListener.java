package com.axonrh.notification.kafka;

import com.axonrh.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TimesheetEventsListener {

    private final NotificationService notificationService;

    @KafkaListener(topics = "timesheet.domain.events", groupId = "notification-service")
    public void handleTimesheetEvent(Map<String, Object> event) {
        try {
            String eventType = (String) event.get("eventType");
            Object tenantIdObj = event.get("tenantId");
            Object employeeIdObj = event.get("employeeId"); // This is the user_id in this context
            
            if (tenantIdObj == null || employeeIdObj == null) return;
            
            UUID tenantId = UUID.fromString(tenantIdObj.toString());
            UUID employeeUserId = UUID.fromString(employeeIdObj.toString());
            String employeeName = (String) event.get("employeeName");
            String recordDate = (String) event.get("recordDate");

            log.info("Recebido evento de timesheet: {} para usuario {}", eventType, employeeUserId);

            switch (eventType) {
                case "ADJUSTMENT_REQUESTED":
                    if (event.containsKey("managerUserId")) {
                        String managerIdStr = (String) event.get("managerUserId");
                        if (managerIdStr != null) {
                            UUID managerUserId = UUID.fromString(managerIdStr);
                            notificationService.pendingApproval(
                                    tenantId,
                                    managerUserId,
                                    "Ajuste de Ponto",
                                    "O colaborador " + employeeName + " solicitou ajuste de ponto para " + recordDate,
                                    "/timesheet/adjustments",
                                    "TIME_ADJUSTMENT",
                                    UUID.fromString((String) event.get("adjustmentId"))
                            );
                        }
                    }
                    break;
                    
                case "ADJUSTMENT_APPROVED":
                    if (event.containsKey("requesterUserId")) {
                        String requesterIdStr = (String) event.get("requesterUserId");
                        if (requesterIdStr != null) {
                            UUID requesterUserId = UUID.fromString(requesterIdStr);
                            notificationService.success(
                                    tenantId,
                                    requesterUserId,
                                    "Ajuste de Ponto Aprovado",
                                    "Sua solicitação de ajuste para o dia " + recordDate + " foi aprovada."
                            );
                        }
                    }
                    break;
                    
                case "ADJUSTMENT_REJECTED":
                    if (event.containsKey("requesterUserId")) {
                        String requesterIdStr = (String) event.get("requesterUserId");
                        if (requesterIdStr != null) {
                            UUID requesterUserId = UUID.fromString(requesterIdStr);
                            notificationService.alert(
                                    tenantId,
                                    requesterUserId,
                                    "Ajuste de Ponto Rejeitado",
                                    "Sua solicitação de ajuste para o dia " + recordDate + " foi rejeitada."
                            );
                        }
                    }
                    break;
            }
        } catch (Exception e) {
            log.error("Erro ao processar evento de timesheet", e);
        }
    }
}
