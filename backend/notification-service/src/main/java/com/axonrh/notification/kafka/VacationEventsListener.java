package com.axonrh.notification.kafka;

import com.axonrh.notification.entity.Notification;
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
    public void handleVacationEvent(Map<String, Object> event) {
        try {
            String eventType = (String) event.get("eventType");
            Object tenantIdObj = event.get("tenantId");
            Object employeeIdObj = event.get("employeeId");
            
            if (tenantIdObj == null) return;
            
            UUID tenantId = UUID.fromString(tenantIdObj.toString());
            UUID employeeId = employeeIdObj != null ? UUID.fromString(employeeIdObj.toString()) : null;

            log.info("Recebido evento: {} para funcionario {}", eventType, employeeId);

            String employeeEmail = (String) event.get("employeeEmail");
            String employeeName = (String) event.get("employeeName");
            String startDate = (String) event.get("startDate");
            String endDate = (String) event.get("endDate");
            UUID requesterUserId = getUUID(event, "requesterUserId");

            Map<String, String> emailVars = new java.util.HashMap<>();
            emailVars.put("employee_name", employeeName != null ? employeeName : "Colaborador");
            emailVars.put("start_date", startDate != null ? startDate : "");
            emailVars.put("end_date", endDate != null ? endDate : "");
            emailVars.put("approver_name", "Gestor/RH");

            switch (eventType) {
                case "VACATION_REQUESTED":
                case "LEAVE_REQUESTED":
                    if (event.containsKey("managerUserId")) {
                        String managerUserIdStr = (String) event.get("managerUserId");
                        if (managerUserIdStr != null) {
                           UUID managerUserId = UUID.fromString(managerUserIdStr);
                           String title = eventType.equals("VACATION_REQUESTED") ? "Solicitação de Férias" : "Solicitação de Licença";
                           
                            notificationService.createNotification(
                                    tenantId,
                                    managerUserId,
                                    null,
                                    Notification.NotificationType.APPROVAL,
                                    "APPROVAL",
                                    title,
                                    "Nova solicitação de " + (eventType.contains("VACATION") ? "férias" : "licença") + " para aprovar.",
                                    "clock",
                                    null,
                                    Notification.ActionType.ROUTE,
                                    eventType.contains("VACATION") ? "/vacation/approvals" : "/vacation/leaves/approvals",
                                    null,
                                    Notification.Priority.HIGH,
                                    eventType.contains("VACATION") ? "VACATION_REQUEST" : "LEAVE_REQUEST",
                                    getUUID(event, "requestId"),
                                    true,
                                    null,
                                    null,
                                    "VACATION_REQUEST",
                                    emailVars
                            );
                        }
                    }
                    break;

                case "VACATION_APPROVED":
                case "LEAVE_APPROVED":
                    String status = (String) event.get("status");
                    if ("MANAGER_APPROVED".equals(status)) {
                        notificationService.notify(
                                tenantId,
                                requesterUserId,
                                "Aprovação do Gestor",
                                "Sua solicitação foi aprovada pelo gestor e está aguardando análise do RH."
                        );
                    } else {
                        String title = eventType.equals("VACATION_APPROVED") ? "Férias Aprovadas" : "Licença Aprovada";
                        String message = eventType.equals("VACATION_APPROVED") ? 
                            "Sua solicitação de férias foi aprovada e agendada!" : 
                            "Sua solicitação de licença foi aprovada!";
                        
                        notificationService.createNotification(
                                tenantId,
                                requesterUserId,
                                null,
                                Notification.NotificationType.SUCCESS,
                                "VACATION",
                                title,
                                message,
                                "check-circle",
                                null,
                                null,
                                null,
                                null,
                                Notification.Priority.NORMAL,
                                null,
                                null,
                                true,
                                employeeEmail,
                                employeeName,
                                "VACATION_APPROVED",
                                emailVars
                        );
                    }
                    break;

                case "VACATION_REJECTED":
                case "LEAVE_REJECTED":
                    String rejectTitle = eventType.contains("VACATION") ? "Férias Rejeitadas" : "Licença Rejeitada";
                    notificationService.alert(
                            tenantId,
                            requesterUserId,
                            rejectTitle,
                            "Sua solicitação foi rejeitada."
                    );
                    break;

                case "VACATION_EXPIRATION_WARNING":
                     notificationService.alert(
                            tenantId,
                            requesterUserId,
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
