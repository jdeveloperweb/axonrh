package com.axonrh.employee.entity;

import com.axonrh.employee.entity.enums.DigitalHiringStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Entidade de processo de contratacao digital.
 * Controla todo o fluxo desde o disparo automatico (aprovacao em recrutamento)
 * ate a criacao do colaborador definitivo no employee-service.
 */
@Entity
@Table(name = "digital_hiring_processes", schema = "shared")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalHiringProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    // ==================== Vinculo com recrutamento ====================

    @Column(name = "candidate_id")
    private UUID candidateId;

    @Column(name = "vacancy_id")
    private UUID vacancyId;

    // ==================== Token de acesso publico ====================

    @Column(name = "access_token", nullable = false, unique = true, length = 64)
    private String accessToken;

    @Column(name = "link_expires_at")
    private LocalDateTime linkExpiresAt;

    @Column(name = "link_accessed_at")
    private LocalDateTime linkAccessedAt;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    // ==================== Dados do candidato ====================

    @Column(name = "candidate_name", nullable = false, length = 200)
    private String candidateName;

    @Column(name = "candidate_email", nullable = false, length = 200)
    private String candidateEmail;

    @Column(name = "candidate_cpf", length = 11)
    private String candidateCpf;

    @Column(name = "candidate_phone", length = 20)
    private String candidatePhone;

    // ==================== Cargo / departamento ====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @Column(name = "employment_type", length = 30)
    private String employmentType;

    @Column(name = "base_salary", precision = 12, scale = 2)
    private BigDecimal baseSalary;

    @Column(name = "expected_hire_date")
    private LocalDate expectedHireDate;

    // ==================== Status e progresso ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DigitalHiringStatus status = DigitalHiringStatus.ADMISSION_PENDING;

    @Column(name = "current_step")
    @Builder.Default
    private Integer currentStep = 1;

    // ==================== Dados preenchidos pelo candidato ====================

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "personal_data", columnDefinition = "jsonb")
    private Map<String, Object> personalData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "work_data", columnDefinition = "jsonb")
    private Map<String, Object> workData;

    // ==================== Documentos ====================

    @OneToMany(mappedBy = "digitalHiringProcess", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DigitalHiringDocument> documents = new ArrayList<>();

    // ==================== Contrato e assinatura ====================

    @Column(name = "contract_html", columnDefinition = "TEXT")
    private String contractHtml;

    @Column(name = "contract_generated_at")
    private LocalDateTime contractGeneratedAt;

    @Column(name = "contract_signed_at")
    private LocalDateTime contractSignedAt;

    @Column(name = "contract_signed")
    @Builder.Default
    private Boolean contractSigned = false;

    @Column(name = "signature_ip", length = 50)
    private String signatureIp;

    @Column(name = "signature_user_agent", length = 500)
    private String signatureUserAgent;

    @Column(name = "confidentiality_html", columnDefinition = "TEXT")
    private String confidentialityHtml;

    @Column(name = "policy_html", columnDefinition = "TEXT")
    private String policyHtml;

    // ==================== IA ====================

    @Column(name = "ai_consistency_score")
    private Integer aiConsistencyScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_alerts", columnDefinition = "jsonb")
    private List<Map<String, Object>> aiAlerts;

    // ==================== Colaborador criado ====================

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(name = "registration_number", length = 20)
    private String registrationNumber;

    // ==================== Auditoria ====================

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private UUID createdBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    // ==================== Metodos ====================

    public boolean isLinkValid() {
        return linkExpiresAt != null && LocalDateTime.now().isBefore(linkExpiresAt);
    }

    public void addDocument(DigitalHiringDocument document) {
        documents.add(document);
        document.setDigitalHiringProcess(this);
        document.setTenantId(this.tenantId);
    }

    public int getTotalSteps() {
        return 5;
    }

    public double getProgressPercent() {
        return switch (status) {
            case ADMISSION_PENDING -> personalData != null ? 20.0 : 5.0;
            case DOCUMENTS_PENDING -> 40.0;
            case DOCUMENTS_VALIDATING -> 60.0;
            case SIGNATURE_PENDING -> 80.0;
            case COMPLETED -> 100.0;
            case CANCELLED -> 0.0;
        };
    }

    public int getPendingDocuments() {
        return (int) documents.stream()
                .filter(d -> !"VALID".equals(d.getValidationStatus()))
                .count();
    }

    public int getValidatedDocuments() {
        return (int) documents.stream()
                .filter(d -> "VALID".equals(d.getValidationStatus()))
                .count();
    }

    public void advanceToDocuments() {
        this.currentStep = 2;
        this.status = DigitalHiringStatus.DOCUMENTS_PENDING;
    }

    public void advanceToValidation() {
        this.currentStep = 2;
        this.status = DigitalHiringStatus.DOCUMENTS_VALIDATING;
    }

    public void advanceToSignature() {
        this.currentStep = 4;
        this.status = DigitalHiringStatus.SIGNATURE_PENDING;
    }

    public void complete(Employee employee) {
        this.employee = employee;
        this.registrationNumber = employee.getRegistrationNumber();
        this.status = DigitalHiringStatus.COMPLETED;
        this.currentStep = 5;
        this.completedAt = LocalDateTime.now();
    }

    public void cancel(String reason) {
        this.status = DigitalHiringStatus.CANCELLED;
        this.cancelReason = reason;
        this.cancelledAt = LocalDateTime.now();
    }
}
