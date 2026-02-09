package com.axonrh.notification.controller;

import com.axonrh.notification.entity.Notification;
import com.axonrh.notification.entity.Notification.NotificationType;
import com.axonrh.notification.entity.Notification.ActionType;
import com.axonrh.notification.entity.Notification.Priority;
import com.axonrh.notification.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<Page<Notification>> getNotifications(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            Pageable pageable) {
        
        // Log para debug
        java.util.logging.Logger.getLogger(NotificationController.class.getName())
            .info("Buscando notificacoes para tenant=" + tenantId + ", user=" + userId);

        return ResponseEntity.ok(notificationService.getUserNotifications(tenantId, userId, pageable));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId) {

        return ResponseEntity.ok(notificationService.getUnreadNotifications(tenantId, userId));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId) {

        long count = notificationService.countUnread(tenantId, userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody CreateNotificationRequest request) {

        Notification notification = notificationService.createNotification(
                tenantId,
                request.userId(),
                request.employeeId(),
                request.type(),
                request.category(),
                request.title(),
                request.message(),
                request.icon(),
                request.imageUrl(),
                request.actionType(),
                request.actionUrl(),
                request.actionData(),
                request.priority() != null ? request.priority() : Priority.NORMAL,
                request.sourceType(),
                request.sourceId(),
                request.sendPush() != null ? request.sendPush() : false
        );
        return ResponseEntity.ok(notification);
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<Notification> markAsRead(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @PathVariable UUID notificationId) {

        return notificationService.markAsRead(tenantId, userId, notificationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId) {

        notificationService.markAllAsRead(tenantId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{notificationId}/archive")
    public ResponseEntity<Notification> archiveNotification(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @PathVariable UUID notificationId) {

        return notificationService.archive(tenantId, userId, notificationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @PathVariable UUID notificationId) {

        notificationService.delete(tenantId, userId, notificationId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk")
    public ResponseEntity<Void> sendBulkNotification(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody BulkNotificationRequest request) {

        notificationService.notifyMultipleUsers(
                tenantId,
                request.userIds(),
                request.type(),
                request.category(),
                request.title(),
                request.message(),
                request.sendPush() != null ? request.sendPush() : false
        );
        return ResponseEntity.ok().build();
    }

    // Request DTOs
    public record CreateNotificationRequest(
            UUID userId,
            UUID employeeId,
            NotificationType type,
            String category,
            String title,
            String message,
            String icon,
            String imageUrl,
            ActionType actionType,
            String actionUrl,
            String actionData,
            Priority priority,
            String sourceType,
            UUID sourceId,
            Boolean sendPush
    ) {}

    public record BulkNotificationRequest(
            List<UUID> userIds,
            NotificationType type,
            String category,
            String title,
            String message,
            Boolean sendPush
    ) {}
}
