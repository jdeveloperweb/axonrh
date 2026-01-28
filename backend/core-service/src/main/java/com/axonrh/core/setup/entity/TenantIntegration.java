package com.axonrh.core.setup.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "tenant_integrations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantIntegration {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    // eSocial
    @Column(name = "esocial_enabled")
    private Boolean esocialEnabled;

    @Column(name = "esocial_environment")
    private String esocialEnvironment;

    @Column(name = "esocial_certificate_id")
    private String esocialCertificateId;

    // Accounting
    @Column(name = "accounting_software")
    private String accountingSoftware;

    @Column(name = "accounting_api_key")
    private String accountingApiKey;

    @Column(name = "accounting_api_url")
    private String accountingApiUrl;

    // ERP
    @Column(name = "erp_system")
    private String erpSystem;

    @Column(name = "erp_api_url")
    private String erpApiUrl;

    @Column(name = "erp_auth_token")
    private String erpAuthToken;

    // Benefits
    @Column(name = "benefits_provider")
    private String benefitsProvider;

    @Column(name = "benefits_api_key")
    private String benefitsApiKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
