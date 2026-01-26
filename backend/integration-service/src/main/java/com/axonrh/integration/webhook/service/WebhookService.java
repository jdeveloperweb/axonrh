package com.axonrh.integration.webhook.service;

import com.axonrh.integration.webhook.entity.Webhook;
import com.axonrh.integration.webhook.entity.Webhook.EventType;
import com.axonrh.integration.webhook.entity.WebhookDelivery;
import com.axonrh.integration.webhook.repository.WebhookDeliveryRepository;
import com.axonrh.integration.webhook.repository.WebhookRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class WebhookService {

    private static final Logger log = LoggerFactory.getLogger(WebhookService.class);
    private static final String SIGNATURE_HEADER = "X-Webhook-Signature";

    private final WebhookRepository webhookRepository;
    private final WebhookDeliveryRepository deliveryRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public WebhookService(WebhookRepository webhookRepository,
                          WebhookDeliveryRepository deliveryRepository,
                          ObjectMapper objectMapper) {
        this.webhookRepository = webhookRepository;
        this.deliveryRepository = deliveryRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Registra um novo webhook.
     */
    public Webhook createWebhook(UUID tenantId, CreateWebhookRequest request) {
        Webhook webhook = new Webhook();
        webhook.setTenantId(tenantId);
        webhook.setName(request.name());
        webhook.setDescription(request.description());
        webhook.setTargetUrl(request.targetUrl());
        webhook.setHttpMethod(request.httpMethod() != null ? request.httpMethod() : "POST");
        webhook.setEventType(request.eventType());
        webhook.setSecretKey(request.secretKey() != null ? request.secretKey() : generateSecretKey());
        webhook.setHeaders(request.headers());
        webhook.setRetryCount(request.retryCount() != null ? request.retryCount() : 3);
        webhook.setTimeoutSeconds(request.timeoutSeconds() != null ? request.timeoutSeconds() : 30);
        webhook.setCreatedBy(request.createdBy());

        return webhookRepository.save(webhook);
    }

    /**
     * Dispara webhooks para um evento especifico.
     */
    @Async
    public void triggerWebhooks(UUID tenantId, EventType eventType, Map<String, Object> payload) {
        List<Webhook> webhooks = webhookRepository.findActiveByEventType(tenantId, eventType);

        for (Webhook webhook : webhooks) {
            triggerWebhook(webhook, payload);
        }
    }

    /**
     * Dispara um webhook especifico.
     */
    public WebhookDelivery triggerWebhook(Webhook webhook, Map<String, Object> payload) {
        WebhookDelivery delivery = new WebhookDelivery();
        delivery.setTenantId(webhook.getTenantId());
        delivery.setWebhook(webhook);
        delivery.setEventType(webhook.getEventType());

        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            delivery.setRequestPayload(payloadJson);

            // Build request
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(webhook.getTargetUrl()))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(webhook.getTimeoutSeconds()));

            // Add custom headers
            if (webhook.getHeaders() != null) {
                Map<String, String> customHeaders = objectMapper.readValue(
                        webhook.getHeaders(),
                        objectMapper.getTypeFactory().constructMapType(Map.class, String.class, String.class)
                );
                customHeaders.forEach(requestBuilder::header);
            }

            // Add signature
            if (webhook.getSecretKey() != null) {
                String signature = generateSignature(payloadJson, webhook.getSecretKey());
                requestBuilder.header(SIGNATURE_HEADER, signature);
            }

            // Set method and body
            HttpRequest request = switch (webhook.getHttpMethod().toUpperCase()) {
                case "POST" -> requestBuilder.POST(HttpRequest.BodyPublishers.ofString(payloadJson)).build();
                case "PUT" -> requestBuilder.PUT(HttpRequest.BodyPublishers.ofString(payloadJson)).build();
                default -> requestBuilder.POST(HttpRequest.BodyPublishers.ofString(payloadJson)).build();
            };

            delivery.setRequestUrl(webhook.getTargetUrl());
            delivery.setRequestMethod(webhook.getHttpMethod());

            // Send request
            long startTime = System.currentTimeMillis();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long duration = System.currentTimeMillis() - startTime;

            delivery.setResponseStatusCode(response.statusCode());
            delivery.setResponseBody(truncate(response.body(), 10000));
            delivery.setDurationMs((int) duration);

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                delivery.setStatus(WebhookDelivery.DeliveryStatus.SUCCESS);
                webhook.incrementSuccess();
            } else {
                delivery.setStatus(WebhookDelivery.DeliveryStatus.FAILED);
                delivery.setErrorMessage("HTTP " + response.statusCode());
                webhook.incrementFailure();
            }

        } catch (Exception e) {
            log.error("Erro ao disparar webhook {}: {}", webhook.getId(), e.getMessage());
            delivery.setStatus(WebhookDelivery.DeliveryStatus.FAILED);
            delivery.setErrorMessage(e.getMessage());
            webhook.incrementFailure();
        }

        webhookRepository.save(webhook);
        return deliveryRepository.save(delivery);
    }

    /**
     * Reenvia uma entrega falha.
     */
    public WebhookDelivery retryDelivery(UUID tenantId, UUID deliveryId) {
        WebhookDelivery original = deliveryRepository.findByTenantIdAndId(tenantId, deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Entrega não encontrada"));

        if (original.getRetryCount() >= original.getWebhook().getRetryCount()) {
            throw new IllegalStateException("Número máximo de tentativas atingido");
        }

        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(original.getRequestPayload(),
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Erro ao parsear payload original", e);
        }

        WebhookDelivery retry = triggerWebhook(original.getWebhook(), payload);
        retry.setRetryCount(original.getRetryCount() + 1);
        retry.setOriginalDeliveryId(original.getId());

        return deliveryRepository.save(retry);
    }

    public List<Webhook> listWebhooks(UUID tenantId) {
        return webhookRepository.findByTenantId(tenantId);
    }

    public Optional<Webhook> getWebhook(UUID tenantId, UUID webhookId) {
        return webhookRepository.findByTenantIdAndId(tenantId, webhookId);
    }

    public Webhook updateWebhook(UUID tenantId, UUID webhookId, UpdateWebhookRequest request) {
        Webhook webhook = webhookRepository.findByTenantIdAndId(tenantId, webhookId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook não encontrado"));

        if (request.name() != null) webhook.setName(request.name());
        if (request.description() != null) webhook.setDescription(request.description());
        if (request.targetUrl() != null) webhook.setTargetUrl(request.targetUrl());
        if (request.httpMethod() != null) webhook.setHttpMethod(request.httpMethod());
        if (request.headers() != null) webhook.setHeaders(request.headers());
        if (request.retryCount() != null) webhook.setRetryCount(request.retryCount());
        if (request.timeoutSeconds() != null) webhook.setTimeoutSeconds(request.timeoutSeconds());
        if (request.isActive() != null) webhook.setActive(request.isActive());

        return webhookRepository.save(webhook);
    }

    public void deleteWebhook(UUID tenantId, UUID webhookId) {
        Webhook webhook = webhookRepository.findByTenantIdAndId(tenantId, webhookId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook não encontrado"));
        webhookRepository.delete(webhook);
    }

    public List<WebhookDelivery> getDeliveryHistory(UUID tenantId, UUID webhookId) {
        return deliveryRepository.findByTenantIdAndWebhookId(tenantId, webhookId);
    }

    private String generateSecretKey() {
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }

    private String generateSignature(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return "sha256=" + bytesToHex(hash);
        } catch (Exception e) {
            log.error("Erro ao gerar assinatura: {}", e.getMessage());
            return "";
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String truncate(String str, int maxLength) {
        if (str == null) return null;
        return str.length() > maxLength ? str.substring(0, maxLength) : str;
    }

    // DTOs
    public record CreateWebhookRequest(
            String name,
            String description,
            String targetUrl,
            String httpMethod,
            EventType eventType,
            String secretKey,
            String headers,
            Integer retryCount,
            Integer timeoutSeconds,
            UUID createdBy
    ) {}

    public record UpdateWebhookRequest(
            String name,
            String description,
            String targetUrl,
            String httpMethod,
            String headers,
            Integer retryCount,
            Integer timeoutSeconds,
            Boolean isActive
    ) {}
}
