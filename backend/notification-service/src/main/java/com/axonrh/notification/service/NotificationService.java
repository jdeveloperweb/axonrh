package com.axonrh.notification.service;

import com.axonrh.notification.entity.Notification;
import com.axonrh.notification.entity.Notification.NotificationType;
import com.axonrh.notification.entity.Notification.ActionType;
import com.axonrh.notification.entity.Notification.Priority;
import com.axonrh.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PushNotificationService pushService;
    private final PreferenceService preferenceService;

    public NotificationService(NotificationRepository notificationRepository,
                               SimpMessagingTemplate messagingTemplate,
                               PushNotificationService pushService,
                               PreferenceService preferenceService) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.pushService = pushService;
        this.preferenceService = preferenceService;
    }

    /**
     * Cria e envia notificacao in-app.
     */
    public Notification createNotification(UUID tenantId, UUID userId, UUID employeeId,
                                           NotificationType type, String category,
                                           String title, String message,
                                           String icon, String imageUrl,
                                           ActionType actionType, String actionUrl,
                                           String actionData, Priority priority,
                                           String sourceType, UUID sourceId,
                                           boolean sendPush) {
        
        // 1. Get user preferences
        var prefs = preferenceService.getPreferences(tenantId, userId);
        
        // 2. Check category-specific preferences if category is provided
        boolean inAppEnabled = prefs.isInAppEnabled();
        boolean pushEnabled = prefs.isPushEnabled() && sendPush;
        
        if (category != null) {
            var catPrefs = prefs.getCategoryPreferences() != null ? prefs.getCategoryPreferences().get(category) : null;
            if (catPrefs != null) {
                inAppEnabled = inAppEnabled && catPrefs.isInApp();
                pushEnabled = pushEnabled && catPrefs.isPush();
            }
        }

        Notification saved = null;
        
        // 3. Save and send in-app if enabled
        if (inAppEnabled) {
            Notification notification = new Notification();
            notification.setTenantId(tenantId);
            notification.setUserId(userId);
            notification.setEmployeeId(employeeId);
            notification.setType(type);
            notification.setCategory(category);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setIcon(icon);
            notification.setImageUrl(imageUrl);
            notification.setActionType(actionType);
            notification.setActionUrl(actionUrl);
            notification.setActionData(actionData);
            notification.setPriority(priority);
            notification.setSourceType(sourceType);
            notification.setSourceId(sourceId);

            saved = notificationRepository.save(notification);

            // Send via WebSocket
            sendWebSocketNotification(userId, saved);
        }

        // 4. Send push notification if enabled
        if (pushEnabled) {
            Map<String, String> data = Map.of(
                    "notificationId", saved != null ? saved.getId().toString() : UUID.randomUUID().toString(),
                    "type", type.name(),
                    "category", category != null ? category : "",
                    "actionUrl", actionUrl != null ? actionUrl : ""
            );
            pushService.sendToUser(tenantId, userId, title, message, data, imageUrl);
        }

        return saved;
    }

    /**
     * Cria notificacao simples.
     */
    public Notification notify(UUID tenantId, UUID userId, String title, String message) {
        return createNotification(tenantId, userId, null,
                NotificationType.INFO, null, title, message,
                null, null, null, null, null,
                Priority.NORMAL, null, null, false);
    }

    /**
     * Cria notificacao de alerta.
     */
    public Notification alert(UUID tenantId, UUID userId, String title, String message) {
        return createNotification(tenantId, userId, null,
                NotificationType.ALERT, null, title, message,
                "alert", null, null, null, null,
                Priority.HIGH, null, null, true);
    }

    /**
     * Cria notificacao de sucesso.
     */
    public Notification success(UUID tenantId, UUID userId, String title, String message) {
        return createNotification(tenantId, userId, null,
                NotificationType.SUCCESS, null, title, message,
                "check-circle", null, null, null, null,
                Priority.NORMAL, null, null, false);
    }

    /**
     * Cria notificacao de aprovacao pendente.
     */
    public Notification pendingApproval(UUID tenantId, UUID userId, String title,
                                        String message, String approvalUrl,
                                        String sourceType, UUID sourceId) {
        return createNotification(tenantId, userId, null,
                NotificationType.APPROVAL, "APPROVAL", title, message,
                "clock", null, ActionType.ROUTE, approvalUrl, null,
                Priority.HIGH, sourceType, sourceId, true);
    }

    /**
     * Busca notificacoes do usuario.
     */
    public Page<Notification> getUserNotifications(UUID tenantId, UUID userId, Pageable pageable) {
        return notificationRepository.findByTenantIdAndUserId(tenantId, userId, pageable);
    }

    /**
     * Busca notificacoes nao lidas.
     */
    public List<Notification> getUnreadNotifications(UUID tenantId, UUID userId) {
        return notificationRepository.findUnreadByUser(tenantId, userId);
    }

    /**
     * Conta notificacoes nao lidas.
     */
    public long countUnread(UUID tenantId, UUID userId) {
        return notificationRepository.countUnreadByUser(tenantId, userId);
    }

    /**
     * Marca notificacao como lida.
     */
    public Optional<Notification> markAsRead(UUID tenantId, UUID userId, UUID notificationId) {
        return notificationRepository.findByTenantIdAndIdAndUserId(tenantId, notificationId, userId)
                .map(notification -> {
                    notification.markAsRead();
                    return notificationRepository.save(notification);
                });
    }

    /**
     * Marca todas as notificacoes como lidas.
     */
    public void markAllAsRead(UUID tenantId, UUID userId) {
        notificationRepository.markAllAsRead(tenantId, userId, LocalDateTime.now());
        sendWebSocketUpdate(userId, "all_read", null);
    }

    /**
     * Arquiva notificacao.
     */
    public Optional<Notification> archive(UUID tenantId, UUID userId, UUID notificationId) {
        return notificationRepository.findByTenantIdAndIdAndUserId(tenantId, notificationId, userId)
                .map(notification -> {
                    notification.archive();
                    return notificationRepository.save(notification);
                });
    }

    /**
     * Exclui notificacao.
     */
    public void delete(UUID tenantId, UUID userId, UUID notificationId) {
        notificationRepository.findByTenantIdAndIdAndUserId(tenantId, notificationId, userId)
                .ifPresent(notificationRepository::delete);
    }

    /**
     * Exclui notificacoes antigas.
     */
    public int deleteOldNotifications(UUID tenantId, int daysOld) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        return notificationRepository.deleteOldNotifications(tenantId, cutoffDate);
    }

    /**
     * Envia notificacao para multiplos usuarios.
     */
    public void notifyMultipleUsers(UUID tenantId, List<UUID> userIds,
                                    NotificationType type, String category,
                                    String title, String message,
                                    boolean sendPush) {
        for (UUID userId : userIds) {
            createNotification(tenantId, userId, null,
                    type, category, title, message,
                    null, null, null, null, null,
                    Priority.NORMAL, null, null, sendPush);
        }
    }

    private void sendWebSocketNotification(UUID userId, Notification notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    notification
            );
        } catch (Exception e) {
            log.warn("Failed to send WebSocket notification to user {}: {}", userId, e.getMessage());
        }
    }

    private void sendWebSocketUpdate(UUID userId, String type, Object data) {
        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notification-updates",
                    Map.of("type", type, "data", data != null ? data : "")
            );
        } catch (Exception e) {
            log.warn("Failed to send WebSocket update to user {}: {}", userId, e.getMessage());
        }
    }
}
