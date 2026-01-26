package com.axonrh.employee.dto;

import com.axonrh.employee.entity.enums.AdmissionStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO de resposta do processo de admissao.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdmissionProcessResponse {

    private UUID id;
    private UUID tenantId;

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

    // Admissao
    private LocalDate expectedHireDate;
    private DepartmentInfo department;
    private PositionInfo position;

    // Status
    private AdmissionStatus status;
    private String statusDescription;
    private Integer currentStep;
    private Integer totalSteps;
    private Double progressPercent;

    // Documentos
    private List<DocumentInfo> documents;
    private Integer pendingDocuments;
    private Integer validatedDocuments;

    // Contrato
    private String contractDocumentUrl;
    private LocalDateTime contractGeneratedAt;
    private LocalDateTime contractSignedAt;
    private Boolean contractSigned;

    // eSocial
    private String esocialEventId;
    private LocalDateTime esocialSentAt;
    private String esocialReceipt;

    // Colaborador
    private UUID employeeId;

    // Auditoria
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
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
        private String status;
        private String validationMessage;
        private LocalDateTime uploadedAt;
        private Boolean hasOcrData;
    }
}
