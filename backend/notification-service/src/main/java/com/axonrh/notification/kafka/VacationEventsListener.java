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
public class VacationEventsListener {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "vacation.domain.events", groupId = "notification-service")
    public void handleVacationEvent(String message) {
        try {
            Map<String, Object> event = objectMapper.readValue(message, Map.class);
            String eventType = (String) event.get("eventType");
            String tenantIdStr = (String) event.get("tenantId");
            String employeeIdStr = (String) event.get("employeeId");
            UUID tenantId = UUID.fromString(tenantIdStr);
            UUID employeeId = UUID.fromString(employeeIdStr);

            log.info("Recebido evento de ferias: {} para funcionario {}", eventType, employeeId);

            switch (eventType) {
                case "VACATION_REQUESTED":
                    if (event.containsKey("managerUserId")) {
                        String managerUserIdStr = (String) event.get("managerUserId");
                        if (managerUserIdStr != null) {
                           UUID managerUserId = UUID.fromString(managerUserIdStr);
                            notificationService.pendingApproval(
                                    tenantId,
                                    managerUserId,
                                    "Solicitação de Férias",
                                    "Nova solicitação de férias para aprovar.",
                                    "/vacation/approvals",
                                    "VACATION_REQUEST",
                                    getUUID(event, "requestId")
                            );
                        }
                    }
                    break;
                case "VACATION_APPROVED":
                    notificationService.success(
                            tenantId,
                            getUUID(event, "requesterUserId"),
                            "Férias Aprovadas",
                            "Sua solicitação de férias foi aprovada!"
                    );
                    break;
                case "VACATION_REJECTED":
                     notificationService.alert(
                            tenantId,
                            getUUID(event, "requesterUserId"),
                            "Férias Rejeitadas",
                            "Sua solicitação de férias foi rejeitada."
                    );
                    break;
                case "VACATION_EXPIRATION_WARNING":
                     notificationService.alert(
                            tenantId,
                            getUUID(event, "requesterUserId"),
                            "Férias Vencendo",
                            "Você possui um período de férias próximo do vencimento."
                    );
                    break;
            }
        } catch (Exception e) {
            log.error("Erro ao processar evento de ferias", e);
        }
    }
    
    private UUID getUUID(Map<String, Object> map, String key) {
        if (map.containsKey(key)) {
            Object val = map.get(key);
            if (val != null) {
                return UUID.fromString(val.toString());
            }
        }
        return null;
    }
}
