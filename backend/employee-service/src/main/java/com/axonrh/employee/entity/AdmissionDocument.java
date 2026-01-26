package com.axonrh.employee.entity;

import com.axonrh.employee.entity.enums.DocumentValidationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * T110 - Documento enviado no processo de admissao.
 */
@Entity
@Table(name = "admission_documents")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdmissionDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_process_id", nullable = false)
    private AdmissionProcess admissionProcess;

    /**
     * Tipo do documento (RG, CPF, CNH, COMPROVANTE_RESIDENCIA, etc).
     */
    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType;

    /**
     * Nome original do arquivo.
     */
    @Column(name = "original_file_name", nullable = false, length = 200)
    private String originalFileName;

    /**
     * Caminho no storage (MinIO).
     */
    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    /**
     * URL publica temporaria.
     */
    @Column(name = "public_url", length = 1000)
    private String publicUrl;

    @Column(name = "public_url_expires_at")
    private LocalDateTime publicUrlExpiresAt;

    /**
     * Metadados do arquivo.
     */
    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_hash", length = 64)
    private String fileHash;

    /**
     * Status da validacao.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "validation_status", length = 30)
    @Builder.Default
    private DocumentValidationStatus validationStatus = DocumentValidationStatus.PENDING;

    @Column(name = "validation_message", length = 500)
    private String validationMessage;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Column(name = "validated_by")
    private UUID validatedBy;

    /**
     * Dados extraidos via OCR (T111).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ocr_data", columnDefinition = "jsonb")
    private Map<String, Object> ocrData;

    @Column(name = "ocr_confidence")
    private Double ocrConfidence;

    @Column(name = "ocr_processed_at")
    private LocalDateTime ocrProcessedAt;

    /**
     * Se o documento foi verificado manualmente.
     */
    @Column(name = "manually_verified")
    @Builder.Default
    private Boolean manuallyVerified = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Valida se o documento e uma imagem.
     */
    public boolean isImage() {
        return mimeType != null && mimeType.startsWith("image/");
    }

    /**
     * Valida se o documento e PDF.
     */
    public boolean isPdf() {
        return "application/pdf".equals(mimeType);
    }
}
