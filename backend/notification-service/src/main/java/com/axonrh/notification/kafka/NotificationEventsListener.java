package com.axonrh.notification.kafka;

import com.axonrh.notification.entity.Notification;
import com.axonrh.notification.service.EmailService;
import com.axonrh.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Listener para eventos genéricos de notificação.
 * Consome do tópico notification.events e despacha para os canais apropriados.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventsListener {

    private final NotificationService notificationService;
    private final EmailService emailService;

    @KafkaListener(topics = "notification.events", groupId = "notification-service")
    public void handleNotificationEvent(Map<String, Object> event) {
        try {
            log.info("Recebido evento de notificacao: {}", event);

            Object tenantIdObj = event.get("tenantId");
            if (tenantIdObj == null) {
                log.warn("Evento de notificacao recebido sem tenantId: {}", event);
                return;
            }
            UUID tenantId = UUID.fromString(tenantIdObj.toString());

            String templateCode = (String) event.get("templateCode");
            String title = (String) event.get("title");
            String body = (String) event.get("body");
            
            // Processar variáveis do template
            @SuppressWarnings("unchecked")
            Map<String, Object> variablesRaw = (Map<String, Object>) event.get("variables");
            Map<String, String> variables = null;
            if (variablesRaw != null) {
                variables = variablesRaw.entrySet().stream()
                        .filter(e -> e.getKey() != null)
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> e.getValue() != null ? e.getValue().toString() : ""
                        ));
            }

            // 1. Processar destinatários internos (User IDs)
            @SuppressWarnings("unchecked")
            List<String> recipientIds = (List<String>) event.get("recipientIds");
            if (recipientIds != null && !recipientIds.isEmpty()) {
                for (String userIdStr : recipientIds) {
                    try {
                        UUID userId = UUID.fromString(userIdStr);
                        log.info("Processando notificacao para usuario interno: {}", userId);
                        
                        notificationService.createNotification(
                                tenantId,
                                userId,
                                null,
                                Notification.NotificationType.INFO,
                                (String) event.get("category"),
                                title,
                                body,
                                (String) event.get("icon"),
                                (String) event.get("imageUrl"),
                                null,
                                (String) event.get("actionUrl"),
                                null,
                                Notification.Priority.NORMAL,
                                (String) event.get("sourceType"),
                                getUUID(event, "sourceId"),
                                true, // sendPush
                                null, // recipientEmail
                                null, // recipientName
                                templateCode,
                                variables
                        );
                    } catch (Exception e) {
                        log.error("Erro ao enviar notificacao para usuario {}: {}", userIdStr, e.getMessage());
                    }
                }
            }

            // 2. Processar emails externos (Candidatos, etc)
            @SuppressWarnings("unchecked")
            List<String> externalEmails = (List<String>) event.get("externalEmails");
            if (externalEmails != null && !externalEmails.isEmpty()) {
                for (String email : externalEmails) {
                    try {
                        log.info("Enviando email externo para: {} usando template: {}", email, templateCode);
                        emailService.sendTemplateEmail(tenantId, templateCode, email, null, variables);
                    } catch (Exception e) {
                        log.error("Erro ao enviar email externo para {}: {}", email, e.getMessage());
                    }
                }
            }

        } catch (Exception e) {
            log.error("Erro crítico ao processar evento de notificacao", e);
        }
    }

    private UUID getUUID(Map<String, Object> map, String key) {
        if (map.containsKey(key) && map.get(key) != null) {
            try {
                return UUID.fromString(map.get(key).toString());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}
