package com.axonrh.integration.esocial.entity;

import com.axonrh.integration.esocial.entity.enums.ESocialEventStatus;
import com.axonrh.integration.esocial.entity.enums.ESocialEventType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Evento do eSocial.
 */
@Entity
@Table(name = "int_esocial_events")
public class ESocialEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private ESocialEventType eventType;

    @Column(name = "event_version", nullable = false)
    private String eventVersion = "S_1.2";

    @Column(name = "reference_id", nullable = false)
    private UUID referenceId;

    @Column(name = "reference_type", nullable = false)
    private String referenceType;

    @Column(name = "xml_content", columnDefinition = "TEXT", nullable = false)
    private String xmlContent;

    @Column(name = "xml_signed", columnDefinition = "TEXT")
    private String xmlSigned;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ESocialEventStatus status = ESocialEventStatus.PENDING;

    @Column(name = "receipt_number")
    private String receiptNumber;

    @Column(name = "protocol_number")
    private String protocolNumber;

    @Column(name = "transmission_date")
    private LocalDateTime transmissionDate;

    @Column(name = "processing_date")
    private LocalDateTime processingDate;

    @Column(name = "return_code")
    private String returnCode;

    @Column(name = "return_message", columnDefinition = "TEXT")
    private String returnMessage;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Business methods
    public void markAsSent(String protocol) {
        this.status = ESocialEventStatus.SENT;
        this.protocolNumber = protocol;
        this.transmissionDate = LocalDateTime.now();
    }

    public void markAsAccepted(String receipt) {
        this.status = ESocialEventStatus.ACCEPTED;
        this.receiptNumber = receipt;
        this.processingDate = LocalDateTime.now();
    }

    public void markAsRejected(String code, String message) {
        this.status = ESocialEventStatus.REJECTED;
        this.returnCode = code;
        this.returnMessage = message;
        this.processingDate = LocalDateTime.now();
    }

    public void markAsError(String error) {
        this.status = ESocialEventStatus.ERROR;
        this.lastError = error;
        this.retryCount++;
    }

    public boolean canRetry(int maxRetries) {
        return (status == ESocialEventStatus.ERROR || status == ESocialEventStatus.REJECTED)
                && retryCount < maxRetries;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public ESocialEventType getEventType() {
        return eventType;
    }

    public void setEventType(ESocialEventType eventType) {
        this.eventType = eventType;
    }

    public String getEventVersion() {
        return eventVersion;
    }

    public void setEventVersion(String eventVersion) {
        this.eventVersion = eventVersion;
    }

    public UUID getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(UUID referenceId) {
        this.referenceId = referenceId;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public String getXmlContent() {
        return xmlContent;
    }

    public void setXmlContent(String xmlContent) {
        this.xmlContent = xmlContent;
    }

    public String getXmlSigned() {
        return xmlSigned;
    }

    public void setXmlSigned(String xmlSigned) {
        this.xmlSigned = xmlSigned;
    }

    public ESocialEventStatus getStatus() {
        return status;
    }

    public void setStatus(ESocialEventStatus status) {
        this.status = status;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public String getProtocolNumber() {
        return protocolNumber;
    }

    public void setProtocolNumber(String protocolNumber) {
        this.protocolNumber = protocolNumber;
    }

    public LocalDateTime getTransmissionDate() {
        return transmissionDate;
    }

    public void setTransmissionDate(LocalDateTime transmissionDate) {
        this.transmissionDate = transmissionDate;
    }

    public LocalDateTime getProcessingDate() {
        return processingDate;
    }

    public void setProcessingDate(LocalDateTime processingDate) {
        this.processingDate = processingDate;
    }

    public String getReturnCode() {
        return returnCode;
    }

    public void setReturnCode(String returnCode) {
        this.returnCode = returnCode;
    }

    public String getReturnMessage() {
        return returnMessage;
    }

    public void setReturnMessage(String returnMessage) {
        this.returnMessage = returnMessage;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }

    public String getLastError() {
        return lastError;
    }

    public void setLastError(String lastError) {
        this.lastError = lastError;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
