package com.axonrh.employee.controller;

import com.axonrh.employee.dto.AdmissionProcessRequest;
import com.axonrh.employee.dto.AdmissionProcessResponse;
import com.axonrh.employee.entity.AdmissionDocument;
import com.axonrh.employee.entity.enums.AdmissionStatus;
import com.axonrh.employee.service.AdmissionService;
import com.axonrh.employee.service.ContractService;
import com.axonrh.employee.service.DocumentValidationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for Digital Admission workflow.
 * Handles admission process creation, candidate data collection, document upload, and contract signing.
 */
@RestController
@RequestMapping("/api/v1/admissions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admissão Digital", description = "Endpoints para gestão do processo de admissão digital")
public class AdmissionController {

    private final AdmissionService admissionService;
    private final DocumentValidationService documentValidationService;
    private final ContractService contractService;

    // ==================== HR/Admin Endpoints ====================

    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Criar processo de admissão", description = "Cria um novo processo de admissão e gera link para o candidato")
    @ApiResponse(responseCode = "201", description = "Processo criado com sucesso")
    public ResponseEntity<AdmissionProcessResponse> createAdmissionProcess(
            @Valid @RequestBody AdmissionProcessRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        log.info("Creating admission process for candidate: {} by user: {}", request.getCandidateEmail(), userId);

        AdmissionProcessResponse response = admissionService.createAdmissionProcess(request, userId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar processos de admissão", description = "Lista todos os processos de admissão com filtros")
    public ResponseEntity<Page<AdmissionProcessResponse>> listAdmissionProcesses(
            @RequestParam(required = false) AdmissionStatus status,
            @RequestParam(required = false) String search,
            Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {
        
        setupTenantContext(jwt);

        log.info("Listing admission processes, status: {}, search: {}", status, search);

        Page<AdmissionProcessResponse> processes = admissionService.listProcesses(status, search, pageable);

        return ResponseEntity.ok(processes);
    }

    private void setupTenantContext(Jwt jwt) {
        String tenantId = jwt.getClaimAsString("tenant_id");
        if (tenantId == null) {
            tenantId = jwt.getClaimAsString("tenantId");
        }
        
        if (tenantId != null) {
            log.debug("Configurando TenantContext via JWT: {}", tenantId);
            com.axonrh.employee.config.TenantContext.setCurrentTenant(tenantId);
        } else {
            log.warn("Nao foi possivel encontrar tenant_id ou tenantId no JWT. Claims: {}", jwt.getClaims().keySet());
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Obter processo de admissão", description = "Obtém detalhes de um processo de admissão específico")
    public ResponseEntity<AdmissionProcessResponse> getAdmissionProcess(
            @PathVariable UUID id) {

        log.info("Getting admission process: {}", id);

        AdmissionProcessResponse process = admissionService.getProcessById(id);

        return ResponseEntity.ok(process);
    }

    @PostMapping("/{id}/resend-link")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Reenviar link de admissão", description = "Reenvia o link de admissão para o e-mail do candidato")
    public ResponseEntity<Map<String, String>> resendAdmissionLink(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        log.info("Resending admission link for process: {} by user: {}", id, userId);

        String newLink = admissionService.resendAdmissionLink(id, userId);

        return ResponseEntity.ok(Map.of(
            "message", "Link reenviado com sucesso",
            "link", newLink
        ));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Cancelar processo de admissão", description = "Cancela um processo de admissão em andamento")
    public ResponseEntity<Void> cancelAdmissionProcess(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        String reason = body != null ? body.get("reason") : null;

        log.info("Cancelling admission process: {} by user: {}, reason: {}", id, userId, reason);

        admissionService.cancelProcess(id, userId, reason);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar documentos do processo", description = "Lista todos os documentos enviados no processo de admissão")
    public ResponseEntity<List<AdmissionDocument>> listProcessDocuments(
            @PathVariable UUID id) {

        log.info("Listing documents for process: {}", id);

        List<AdmissionDocument> documents = admissionService.getProcessDocuments(id);

        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{id}/contract-preview")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Visualizar contrato", description = "Visualiza prévia do contrato gerado para o processo")
    public ResponseEntity<String> getContractPreview(
            @PathVariable UUID id,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        log.info("Getting contract preview for process: {}", id);

        var process = admissionService.getProcessEntityById(id);
        String preview = contractService.getContractPreview(process, tenantId);

        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_HTML)
            .body(preview);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Completar admissão manualmente", description = "Completa o processo de admissão e cria o funcionário")
    public ResponseEntity<AdmissionProcessResponse> completeAdmission(
            @PathVariable UUID id,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        log.info("Completing admission process: {} by user: {}", id, userId);

        AdmissionProcessResponse response = admissionService.completeAdmission(id, userId, tenantId);

        return ResponseEntity.ok(response);
    }

    // ==================== Public Candidate Endpoints ====================

    @GetMapping("/public/{token}")
    @Operation(summary = "Acessar processo por token", description = "Permite ao candidato acessar seu processo de admissão via token")
    public ResponseEntity<AdmissionProcessResponse> accessByToken(
            @PathVariable String token) {

        log.info("Candidate accessing process by token");

        AdmissionProcessResponse process = admissionService.accessByToken(token);

        return ResponseEntity.ok(process);
    }

    @PostMapping("/public/{token}/data")
    @Operation(summary = "Salvar dados do candidato", description = "Salva os dados pessoais preenchidos pelo candidato")
    public ResponseEntity<AdmissionProcessResponse> saveCandidateData(
            @PathVariable String token,
            @RequestBody Map<String, Object> candidateData) {

        log.info("Saving candidate data for token");

        AdmissionProcessResponse response = admissionService.saveCandidateData(token, candidateData);

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/public/{token}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload de documento", description = "Faz upload de um documento do candidato")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @PathVariable String token,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        log.info("Uploading document type: {} for token", documentType);

        // Validate file
        documentValidationService.validateFile(file, documentType);

        // Process upload and OCR
        AdmissionDocument document = admissionService.uploadDocument(token, file, documentType, tenantId);

        // Process OCR
        Map<String, Object> ocrResult;
        try {
            ocrResult = documentValidationService.processDocumentOcr(document, file.getBytes());
        } catch (IOException e) {
            throw new IllegalArgumentException("Erro ao ler arquivo enviado", e);
        }

        return ResponseEntity.ok(Map.of(
            "documentId", document.getId(),
            "documentType", document.getDocumentType(),
            "validationStatus", document.getValidationStatus(),
            "ocrData", ocrResult
        ));
    }

    @GetMapping("/public/{token}/documents")
    @Operation(summary = "Listar documentos do candidato", description = "Lista documentos já enviados pelo candidato")
    public ResponseEntity<List<Map<String, Object>>> getCandidateDocuments(
            @PathVariable String token) {

        log.info("Listing documents for candidate token");

        List<Map<String, Object>> documents = admissionService.getCandidateDocuments(token);

        return ResponseEntity.ok(documents);
    }

    @GetMapping("/public/{token}/required-documents")
    @Operation(summary = "Documentos obrigatórios", description = "Retorna lista de documentos obrigatórios e seu status")
    public ResponseEntity<Map<String, Object>> getRequiredDocuments(
            @PathVariable String token) {

        log.info("Getting required documents for token");

        Map<String, Object> requirements = admissionService.getRequiredDocumentsStatus(token);

        return ResponseEntity.ok(requirements);
    }

    @PostMapping("/public/{token}/validate-documents")
    @Operation(summary = "Validar documentos", description = "Solicita validação de todos os documentos enviados")
    public ResponseEntity<Map<String, Object>> validateDocuments(
            @PathVariable String token,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        log.info("Validating all documents for token");

        Map<String, Object> validationResult = admissionService.validateAllDocuments(token, tenantId);

        return ResponseEntity.ok(validationResult);
    }

    @GetMapping("/public/{token}/contract")
    @Operation(summary = "Obter contrato para assinatura", description = "Obtém o contrato de trabalho para visualização e assinatura")
    public ResponseEntity<Map<String, Object>> getContract(
            @PathVariable String token,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        log.info("Getting contract for token");

        Map<String, Object> contract = admissionService.getContractForSignature(token, tenantId);

        return ResponseEntity.ok(contract);
    }

    @PostMapping("/public/{token}/sign-contract")
    @Operation(summary = "Assinar contrato", description = "Registra a assinatura eletrônica do contrato")
    public ResponseEntity<AdmissionProcessResponse> signContract(
            @PathVariable String token,
            @RequestBody Map<String, Object> signatureData,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        log.info("Signing contract for token");

        // signatureData should contain:
        // - signatureImage (base64) or signatureText
        // - ipAddress
        // - userAgent
        // - acceptedTerms: true
        // - biometricData (optional)

        AdmissionProcessResponse response = admissionService.signContract(token, signatureData, tenantId);

        return ResponseEntity.ok(response);
    }

    // ==================== Statistics Endpoints ====================

    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Estatísticas de admissão", description = "Retorna estatísticas dos processos de admissão")
    public ResponseEntity<Map<String, Object>> getAdmissionStatistics(
            @RequestParam(required = false) @Parameter(description = "Data inicial (yyyy-MM-dd)") String startDate,
            @RequestParam(required = false) @Parameter(description = "Data final (yyyy-MM-dd)") String endDate) {

        log.info("Getting admission statistics from {} to {}", startDate, endDate);

        Map<String, Object> statistics = admissionService.getStatistics(startDate, endDate);

        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/statistics/by-status")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Processos por status", description = "Retorna contagem de processos agrupados por status")
    public ResponseEntity<Map<AdmissionStatus, Long>> getProcessesByStatus() {

        log.info("Getting processes count by status");

        Map<AdmissionStatus, Long> countByStatus = admissionService.countByStatus();

        return ResponseEntity.ok(countByStatus);
    }

    @GetMapping("/statistics/average-time")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Tempo médio de admissão", description = "Retorna tempo médio para completar processo de admissão")
    public ResponseEntity<Map<String, Object>> getAverageAdmissionTime() {

        log.info("Getting average admission time");

        Map<String, Object> avgTime = admissionService.getAverageCompletionTime();

        return ResponseEntity.ok(avgTime);
    }
}
