package com.axonrh.employee.dto;

import com.axonrh.employee.entity.enums.DigitalHiringStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO de resposta do processo de contratacao digital.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalHiringResponse {

    private UUID id;
    private UUID tenantId;
    private UUID candidateId;
    private UUID vacancyId;

    // Token e link
    private String accessToken;
    private String publicLink;
    private LocalDateTime linkExpiresAt;
    private Boolean linkValid;

    // Candidato
    private String candidateName;
    private String candidateEmail;
    private String candidateCpf;
    private String candidatePhone;

    // Cargo / Departamento
    private DepartmentInfo department;
    private PositionInfo position;
    private String employmentType;
    private BigDecimal baseSalary;
    private LocalDate expectedHireDate;

    // Status e progresso
    private DigitalHiringStatus status;
    private Integer currentStep;
    private Integer totalSteps;
    private Double progressPercent;

    // Dados preenchidos
    private Map<String, Object> personalData;
    private Map<String, Object> workData;

    // Documentos
    private List<DocumentInfo> documents;
    private Integer pendingDocuments;
    private Integer validatedDocuments;

    // Contrato
    private String contractHtml;
    private LocalDateTime contractGeneratedAt;
    private LocalDateTime contractSignedAt;
    private Boolean contractSigned;
    private String signatureIp;
    private String signatureUserAgent;
    private String signatureTimestamp;

    // IA
    private Integer aiConsistencyScore;
    private List<Map<String, Object>> aiAlerts;

    // Colaborador criado
    private UUID employeeId;
    private String registrationNumber;

    // Auditoria
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private String cancelReason;
    private String notes;

    // ==================== DTOs Aninhados ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DepartmentInfo {
        private UUID id;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PositionInfo {
        private UUID id;
        private String title;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentInfo {
        private UUID id;
        private String documentType;
        private String fileName;
        private Long fileSize;
        private String status;
        private String validationMessage;
        private Map<String, Object> ocrData;
        private String fileUrl;
        private LocalDateTime uploadedAt;
        private LocalDateTime validatedAt;
    }
}
