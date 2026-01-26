package com.axonrh.notification.controller;

import com.axonrh.notification.entity.PushToken;
import com.axonrh.notification.entity.PushToken.DeviceType;
import com.axonrh.notification.service.PushNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications/push")
public class PushController {

    private final PushNotificationService pushService;

    public PushController(PushNotificationService pushService) {
        this.pushService = pushService;
    }

    @PostMapping("/register")
    public ResponseEntity<PushToken> registerToken(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody RegisterTokenRequest request) {

        PushToken token = pushService.registerToken(
                tenantId,
                userId,
                request.employeeId(),
                request.token(),
                request.deviceType(),
                request.deviceName(),
                request.deviceModel(),
                request.osVersion(),
                request.appVersion()
        );
        return ResponseEntity.ok(token);
    }

    @DeleteMapping("/unregister")
    public ResponseEntity<Void> unregisterToken(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody UnregisterTokenRequest request) {

        pushService.deactivateToken(tenantId, request.token());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/send")
    public ResponseEntity<Void> sendPushNotification(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody SendPushRequest request) {

        if (request.userIds() != null && !request.userIds().isEmpty()) {
            pushService.sendToUsers(
                    tenantId,
                    request.userIds(),
                    request.title(),
                    request.body(),
                    request.data(),
                    request.imageUrl()
            );
        } else if (request.userId() != null) {
            pushService.sendToUser(
                    tenantId,
                    request.userId(),
                    request.title(),
                    request.body(),
                    request.data(),
                    request.imageUrl()
            );
        } else if (request.topic() != null) {
            pushService.sendToTopic(
                    request.topic(),
                    request.title(),
                    request.body(),
                    request.data(),
                    request.imageUrl()
            );
        }
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribeToTopic(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody TopicRequest request) {

        pushService.subscribeToTopic(tenantId, userId, request.topic());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribeFromTopic(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody TopicRequest request) {

        pushService.unsubscribeFromTopic(tenantId, userId, request.topic());
        return ResponseEntity.ok().build();
    }

    public record RegisterTokenRequest(
            UUID employeeId,
            String token,
            DeviceType deviceType,
            String deviceName,
            String deviceModel,
            String osVersion,
            String appVersion
    ) {}

    public record UnregisterTokenRequest(String token) {}

    public record SendPushRequest(
            UUID userId,
            List<UUID> userIds,
            String topic,
            String title,
            String body,
            Map<String, String> data,
            String imageUrl
    ) {}

    public record TopicRequest(String topic) {}
}
