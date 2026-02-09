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
    public void handlePerformanceEvent(NotificationEvent event) {
        try {
            String eventType = event.getEventType();
            UUID tenantId = event.getTenantId();
            UUID userId = event.getUserId();

            if (tenantId == null || userId == null) {
                log.warn("Evento de performance recebido sem tenantId ou userId: {}", event);
                return;
            }

            String title = event.getTitle();
            String body = event.getBody();
            String actionUrl = event.getActionUrl();
            String sourceType = event.getSourceType();
            UUID sourceId = event.getSourceId();

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
                            true
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
                            true
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
                            true
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
                            true
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
                            true
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
