package com.axonrh.learning.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Configuração de certificado para um curso específico ou global para o tenant.
 */
@Entity
@Table(name = "certificate_configs", schema = "shared")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificateConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "course_id")
    private UUID courseId; // Se nulo, é a configuração global

    @Column(name = "instructor_name")
    private String instructorName;

    @Column(name = "instructor_signature_url")
    private String instructorSignatureUrl;

    @Column(name = "general_signer_name")
    private String generalSignerName;

    @Column(name = "general_signature_url")
    private String generalSignatureUrl;

    @Column(name = "company_logo_url")
    private String companyLogoUrl;

    @Column(name = "show_company_logo")
    @Builder.Default
    private Boolean showCompanyLogo = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
