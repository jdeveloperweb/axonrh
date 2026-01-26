package com.axonrh.integration.webhook.controller;

import com.axonrh.integration.webhook.entity.Webhook;
import com.axonrh.integration.webhook.entity.WebhookDelivery;
import com.axonrh.integration.webhook.service.WebhookService;
import com.axonrh.integration.webhook.service.WebhookService.CreateWebhookRequest;
import com.axonrh.integration.webhook.service.WebhookService.UpdateWebhookRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/webhooks")
public class WebhookController {

    private final WebhookService webhookService;

    public WebhookController(WebhookService webhookService) {
        this.webhookService = webhookService;
    }

    @PostMapping
    public ResponseEntity<Webhook> createWebhook(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody CreateWebhookRequest request) {

        Webhook webhook = webhookService.createWebhook(tenantId, request);
        return ResponseEntity.ok(webhook);
    }

    @GetMapping
    public ResponseEntity<List<Webhook>> listWebhooks(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {

        return ResponseEntity.ok(webhookService.listWebhooks(tenantId));
    }

    @GetMapping("/{webhookId}")
    public ResponseEntity<Webhook> getWebhook(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID webhookId) {

        return webhookService.getWebhook(tenantId, webhookId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{webhookId}")
    public ResponseEntity<Webhook> updateWebhook(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID webhookId,
            @RequestBody UpdateWebhookRequest request) {

        Webhook webhook = webhookService.updateWebhook(tenantId, webhookId, request);
        return ResponseEntity.ok(webhook);
    }

    @DeleteMapping("/{webhookId}")
    public ResponseEntity<Void> deleteWebhook(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID webhookId) {

        webhookService.deleteWebhook(tenantId, webhookId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{webhookId}/test")
    public ResponseEntity<WebhookDelivery> testWebhook(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID webhookId) {

        Webhook webhook = webhookService.getWebhook(tenantId, webhookId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook não encontrado"));

        Map<String, Object> testPayload = Map.of(
                "event", "test",
                "timestamp", System.currentTimeMillis(),
                "message", "This is a test webhook delivery"
        );

        WebhookDelivery delivery = webhookService.triggerWebhook(webhook, testPayload);
        return ResponseEntity.ok(delivery);
    }

    @GetMapping("/{webhookId}/deliveries")
    public ResponseEntity<List<WebhookDelivery>> getDeliveryHistory(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID webhookId) {

        return ResponseEntity.ok(webhookService.getDeliveryHistory(tenantId, webhookId));
    }

    @PostMapping("/deliveries/{deliveryId}/retry")
    public ResponseEntity<WebhookDelivery> retryDelivery(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID deliveryId) {

        WebhookDelivery delivery = webhookService.retryDelivery(tenantId, deliveryId);
        return ResponseEntity.ok(delivery);
    }

    @GetMapping("/event-types")
    public ResponseEntity<Webhook.EventType[]> getEventTypes() {
        return ResponseEntity.ok(Webhook.EventType.values());
    }
}
