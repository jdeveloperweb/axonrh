package com.axonrh.notification.kafka;

import com.axonrh.kafka.event.notification.NotificationEvent;
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
    public void handleNotificationEvent(NotificationEvent event) {
        try {
            log.info("Recebido evento de notificacao: {}", event);

            UUID tenantId = event.getTenantId();
            if (tenantId == null) {
                log.warn("Evento de notificacao recebido sem tenantId: {}", event);
                return;
            }

            String templateCode = event.getTemplateCode();
            String title = event.getTitle();
            String body = event.getBody();
            
            // Processar variáveis do template
            Map<String, Object> variablesRaw = event.getVariables();
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
            List<UUID> recipientIds = event.getRecipientIds();
            if (recipientIds != null && !recipientIds.isEmpty()) {
                for (UUID userId : recipientIds) {
                    try {
                        log.info("Processando notificacao para usuario interno: {}", userId);
                        
                        notificationService.createNotification(
                                tenantId,
                                userId,
                                null,
                                Notification.NotificationType.INFO,
                                event.getCategory(),
                                title,
                                body,
                                null, // icon
                                null, // imageUrl
                                null,
                                event.getActionUrl(),
                                null,
                                Notification.Priority.NORMAL,
                                event.getSourceType(),
                                event.getSourceId(),
                                true, // sendPush
                                null, // recipientEmail
                                null, // recipientName
                                templateCode,
                                variables
                        );
                    } catch (Exception e) {
                        log.error("Erro ao enviar notificacao para usuario {}: {}", userId, e.getMessage());
                    }
                }
            }

            // 2. Processar emails externos (Candidatos, etc)
            List<String> externalEmails = event.getExternalEmails();
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
}
