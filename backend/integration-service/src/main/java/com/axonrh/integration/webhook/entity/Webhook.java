package com.axonrh.integration.webhook.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "int_webhooks")
public class Webhook {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_url", nullable = false)
    private String targetUrl;

    @Column(name = "http_method", nullable = false, length = 10)
    private String httpMethod = "POST";

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "secret_key")
    private String secretKey;

    @Column(name = "headers", columnDefinition = "TEXT")
    private String headers; // JSON format

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "retry_count")
    private int retryCount = 3;

    @Column(name = "timeout_seconds")
    private int timeoutSeconds = 30;

    @Column(name = "last_triggered_at")
    private LocalDateTime lastTriggeredAt;

    @Column(name = "last_status")
    private String lastStatus;

    @Column(name = "success_count")
    private int successCount = 0;

    @Column(name = "failure_count")
    private int failureCount = 0;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum EventType {
        // Employee events
        EMPLOYEE_CREATED,
        EMPLOYEE_UPDATED,
        EMPLOYEE_TERMINATED,

        // Time events
        TIME_PUNCH,
        TIME_PUNCH_ANOMALY,
        OVERTIME_ALERT,

        // Vacation events
        VACATION_REQUESTED,
        VACATION_APPROVED,
        VACATION_REJECTED,
        VACATION_STARTED,

        // Performance events
        EVALUATION_COMPLETED,
        GOAL_ACHIEVED,
        PDI_CREATED,

        // Learning events
        COURSE_COMPLETED,
        CERTIFICATE_ISSUED,

        // Payroll events
        PAYROLL_PROCESSED,
        PAYROLL_APPROVED,

        // Integration events
        ESOCIAL_TRANSMITTED,
        ESOCIAL_PROCESSED,
        CNAB_GENERATED,
        CNAB_PROCESSED,

        // Custom events
        CUSTOM
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTargetUrl() { return targetUrl; }
    public void setTargetUrl(String targetUrl) { this.targetUrl = targetUrl; }

    public String getHttpMethod() { return httpMethod; }
    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }

    public String getHeaders() { return headers; }
    public void setHeaders(String headers) { this.headers = headers; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }

    public int getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }

    public LocalDateTime getLastTriggeredAt() { return lastTriggeredAt; }
    public void setLastTriggeredAt(LocalDateTime lastTriggeredAt) { this.lastTriggeredAt = lastTriggeredAt; }

    public String getLastStatus() { return lastStatus; }
    public void setLastStatus(String lastStatus) { this.lastStatus = lastStatus; }

    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }

    public int getFailureCount() { return failureCount; }
    public void setFailureCount(int failureCount) { this.failureCount = failureCount; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public void incrementSuccess() {
        this.successCount++;
        this.lastTriggeredAt = LocalDateTime.now();
        this.lastStatus = "SUCCESS";
    }

    public void incrementFailure() {
        this.failureCount++;
        this.lastTriggeredAt = LocalDateTime.now();
        this.lastStatus = "FAILURE";
    }
}
