package com.axonrh.employee.entity;

import com.axonrh.employee.entity.enums.AdmissionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * T109 - Entidade de processo de admissao digital.
 * Controla todo o fluxo desde a geracao do link ate a conclusao.
 */
@Entity
@Table(name = "admission_processes")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdmissionProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /**
     * Token unico para acesso do candidato (link publico).
     */
    @Column(name = "access_token", nullable = false, unique = true, length = 64)
    private String accessToken;

    /**
     * Dados basicos do candidato (preenchidos pelo RH).
     */
    @Column(name = "candidate_name", nullable = false, length = 200)
    private String candidateName;

    @Column(name = "candidate_email", nullable = false, length = 200)
    private String candidateEmail;

    @Column(name = "candidate_cpf", length = 11)
    private String candidateCpf;

    @Column(name = "candidate_phone", length = 20)
    private String candidatePhone;

    /**
     * Data prevista de admissao.
     */
    @Column(name = "expected_hire_date")
    private LocalDate expectedHireDate;

    /**
     * Departamento e cargo pretendidos.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    /**
     * Status atual do processo.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private AdmissionStatus status = AdmissionStatus.LINK_GENERATED;

    /**
     * Etapa atual do processo (1-5).
     */
    @Column(name = "current_step")
    @Builder.Default
    private Integer currentStep = 1;

    /**
     * Dados preenchidos pelo candidato (JSON).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "candidate_data", columnDefinition = "jsonb")
    private Map<String, Object> candidateData;

    /**
     * Documentos enviados.
     */
    @OneToMany(mappedBy = "admissionProcess", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AdmissionDocument> documents = new ArrayList<>();

    /**
     * Contrato gerado.
     */
    @Column(name = "contract_document_url", length = 500)
    private String contractDocumentUrl;

    @Column(name = "contract_generated_at")
    private LocalDateTime contractGeneratedAt;

    @Column(name = "contract_signed_at")
    private LocalDateTime contractSignedAt;

    @Column(name = "contract_signature_id", length = 100)
    private String contractSignatureId;

    /**
     * eSocial.
     */
    @Column(name = "esocial_event_id", length = 50)
    private String esocialEventId;

    @Column(name = "esocial_sent_at")
    private LocalDateTime esocialSentAt;

    @Column(name = "esocial_receipt", length = 100)
    private String esocialReceipt;

    /**
     * Colaborador criado apos conclusao.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    /**
     * Validade do link.
     */
    @Column(name = "link_expires_at")
    private LocalDateTime linkExpiresAt;

    @Column(name = "link_accessed_at")
    private LocalDateTime linkAccessedAt;

    /**
     * Notas e observacoes.
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * Auditoria.
     */
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

    @Column(name = "completed_by")
    private UUID completedBy;

    // ==================== Metodos ====================

    public void addDocument(AdmissionDocument document) {
        documents.add(document);
        document.setAdmissionProcess(this);
        document.setTenantId(this.tenantId);
    }

    public boolean isLinkValid() {
        return linkExpiresAt != null && LocalDateTime.now().isBefore(linkExpiresAt);
    }

    public void advanceStep() {
        if (currentStep < 5) {
            currentStep++;
            updateStatus();
        }
    }

    private void updateStatus() {
        switch (currentStep) {
            case 1 -> status = AdmissionStatus.LINK_GENERATED;
            case 2 -> status = AdmissionStatus.DATA_FILLING;
            case 3 -> status = AdmissionStatus.DOCUMENTS_PENDING;
            case 4 -> status = AdmissionStatus.CONTRACT_PENDING;
            case 5 -> status = AdmissionStatus.SIGNATURE_PENDING;
        }
    }

    public void complete(Employee employee, UUID completedBy) {
        this.employee = employee;
        this.status = AdmissionStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
        this.completedBy = completedBy;
    }
}
