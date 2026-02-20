package com.axonrh.notification.kafka;

import com.axonrh.kafka.event.notification.NotificationEvent;
import com.axonrh.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class PerformanceEventsListener {

    private final NotificationService notificationService;

    @KafkaListener(topics = "performance.domain.events", groupId = "notification-service")
    public void handlePerformanceEvent(java.util.Map<String, Object> event) {
        try {
            String eventType = (String) event.get("eventType");
            Object tenantIdObj = event.get("tenantId");
            Object userIdObj = event.get("userId");

            if (tenantIdObj == null || userIdObj == null) {
                log.warn("Evento de performance recebido sem tenantId ou userId: {}", event);
                return;
            }

            UUID tenantId = UUID.fromString(tenantIdObj.toString());
            UUID userId = UUID.fromString(userIdObj.toString());
            String title = (String) event.get("title");
            String body = (String) event.get("body");
            String actionUrl = (String) event.get("actionUrl");
            String sourceType = (String) event.get("sourceType");
            UUID sourceId = event.get("sourceId") != null ? UUID.fromString(event.get("sourceId").toString()) : null;

            log.info("Recebido evento de performance: {} para usuario {}", eventType, userId);

            switch (eventType) {
                case "PDI_CREATED":
                    notificationService.createNotification(
                            tenantId, userId, null,
                            com.axonrh.notification.entity.Notification.NotificationType.INFO,
                            "PERFORMANCE",
                            title, body,
                            "target", null,
                            com.axonrh.notification.entity.Notification.ActionType.ROUTE,
                            actionUrl, null,
                            com.axonrh.notification.entity.Notification.Priority.NORMAL,
                            sourceType, sourceId,
                            true, null, null, null, null
                    );
                    break;
                case "DISC_ASSIGNED":
                    notificationService.createNotification(
                            tenantId, userId, null,
                            com.axonrh.notification.entity.Notification.NotificationType.ALERT,
                            "PERFORMANCE",
                            title, body,
                            "brain", null,
                            com.axonrh.notification.entity.Notification.ActionType.ROUTE,
                            actionUrl, null,
                            com.axonrh.notification.entity.Notification.Priority.HIGH,
                            sourceType, sourceId,
                            true, null, null, null, null
                    );
                    break;
                case "EVALUATION_CREATED":
                    notificationService.createNotification(
                            tenantId, userId, null,
                            com.axonrh.notification.entity.Notification.NotificationType.APPROVAL,
                            "PERFORMANCE",
                            title, body,
                            "clipboard-check", null,
                            com.axonrh.notification.entity.Notification.ActionType.ROUTE,
                            actionUrl, null,
                            com.axonrh.notification.entity.Notification.Priority.HIGH,
                            sourceType, sourceId,
                            true, null, null, null, null
                    );
                    break;
                case "EVALUATION_REMINDER":
                    notificationService.createNotification(
                            tenantId, userId, null,
                            com.axonrh.notification.entity.Notification.NotificationType.REMINDER,
                            "PERFORMANCE",
                            title, body,
                            "calendar-clock", null,
                            com.axonrh.notification.entity.Notification.ActionType.ROUTE,
                            actionUrl, null,
                            com.axonrh.notification.entity.Notification.Priority.HIGH,
                            sourceType, sourceId,
                            true, null, null, null, null
                    );
                    break;
                case "DISC_REMINDER":
                    notificationService.createNotification(
                            tenantId, userId, null,
                            com.axonrh.notification.entity.Notification.NotificationType.REMINDER,
                            "PERFORMANCE",
                            title, body,
                            "brain", null,
                            com.axonrh.notification.entity.Notification.ActionType.ROUTE,
                            actionUrl, null,
                            com.axonrh.notification.entity.Notification.Priority.HIGH,
                            sourceType, sourceId,
                            true, null, null, null, null
                    );
                    break;
                default:
                    log.warn("Tipo de evento de performance desconhecido: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Erro ao processar evento de performance", e);
        }
    }
}
