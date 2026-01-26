package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.*;
import com.axonrh.employee.entity.*;
import com.axonrh.employee.entity.enums.AdmissionStatus;
import com.axonrh.employee.entity.enums.EmploymentType;
import com.axonrh.employee.exception.DuplicateResourceException;
import com.axonrh.employee.exception.InvalidOperationException;
import com.axonrh.employee.exception.ResourceNotFoundException;
import com.axonrh.employee.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * T109 - Servico de gerenciamento do processo de admissao digital.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdmissionService {

    private final AdmissionProcessRepository admissionRepository;
    private final AdmissionDocumentRepository admissionDocumentRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final EmployeeService employeeService;
    private final ContractService contractService;
    private final DocumentValidationService documentValidationService;
    private final StorageService storageService;
    private final EsocialService esocialService;

    @Value("${admission.link.base-url:http://localhost:3000/admission}")
    private String linkBaseUrl;

    @Value("${admission.link.default-validity-days:7}")
    private int defaultValidityDays;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * T109 - Gera link de admissao para candidato.
     */
    @Transactional
    public AdmissionProcessResponse createAdmissionProcess(AdmissionProcessRequest request, UUID userId) {
        UUID tenantId = getTenantId();
        log.info("Criando processo de admissao para: {} - tenant: {}", request.getCandidateEmail(), tenantId);

        // Verifica se ja existe processo ativo para o email
        List<AdmissionStatus> activeStatuses = List.of(
                AdmissionStatus.LINK_GENERATED,
                AdmissionStatus.DATA_FILLING,
                AdmissionStatus.DOCUMENTS_PENDING,
                AdmissionStatus.DOCUMENTS_VALIDATING,
                AdmissionStatus.CONTRACT_PENDING,
                AdmissionStatus.SIGNATURE_PENDING
        );

        if (admissionRepository.existsByTenantIdAndCandidateEmailAndStatusNotIn(
                tenantId, request.getCandidateEmail(),
                List.of(AdmissionStatus.COMPLETED, AdmissionStatus.CANCELLED, AdmissionStatus.EXPIRED))) {
            throw new DuplicateResourceException("Ja existe processo de admissao ativo para este email");
        }

        // Gera token unico
        String accessToken = generateAccessToken();

        // Calcula validade do link
        int validityDays = request.getLinkValidityDays() != null ? request.getLinkValidityDays() : defaultValidityDays;
        LocalDateTime linkExpiresAt = LocalDateTime.now().plusDays(validityDays);

        // Cria processo
        AdmissionProcess process = AdmissionProcess.builder()
                .tenantId(tenantId)
                .accessToken(accessToken)
                .candidateName(request.getCandidateName())
                .candidateEmail(request.getCandidateEmail())
                .candidateCpf(request.getCandidateCpf())
                .candidatePhone(request.getCandidatePhone())
                .expectedHireDate(request.getExpectedHireDate())
                .linkExpiresAt(linkExpiresAt)
                .notes(request.getNotes())
                .status(AdmissionStatus.LINK_GENERATED)
                .currentStep(1)
                .createdBy(userId)
                .build();

        // Carrega relacionamentos
        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findByTenantIdAndId(tenantId, request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Departamento nao encontrado"));
            process.setDepartment(dept);
        }

        if (request.getPositionId() != null) {
            Position pos = positionRepository.findByTenantIdAndId(tenantId, request.getPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cargo nao encontrado"));
            process.setPosition(pos);
        }

        AdmissionProcess saved = admissionRepository.save(process);

        log.info("Processo de admissao criado: {} - token: {}", saved.getId(), accessToken);

        return mapToResponse(saved);
    }

    /**
     * Acessa processo por token (publico).
     */
    @Transactional
    public AdmissionProcessResponse accessByToken(String token) {
        return findByToken(token);
    }

    /**
     * Busca processo por token (acesso publico do candidato).
     */
    @Transactional
    public AdmissionProcessResponse findByToken(String token) {
        AdmissionProcess process = admissionRepository.findByAccessTokenWithDocuments(token)
                .orElseThrow(() -> new ResourceNotFoundException("Processo de admissao nao encontrado"));

        // Verifica se link expirou
        if (!process.isLinkValid()) {
            process.setStatus(AdmissionStatus.EXPIRED);
            admissionRepository.save(process);
            throw new InvalidOperationException("Link de admissao expirado");
        }

        // Registra primeiro acesso
        if (process.getLinkAccessedAt() == null) {
            process.setLinkAccessedAt(LocalDateTime.now());
            process.setStatus(AdmissionStatus.DATA_FILLING);
            process.setCurrentStep(2);
            admissionRepository.save(process);
        }

        return mapToResponse(process);
    }

    /**
     * Salva dados preenchidos pelo candidato (etapa 2).
     */
    @Transactional
    public AdmissionProcessResponse saveCandidateData(String token, Map<String, Object> data) {
        AdmissionProcess process = admissionRepository.findByAccessToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (!process.isLinkValid()) {
            throw new InvalidOperationException("Link expirado");
        }

        process.setCandidateData(data);

        // Atualiza CPF se fornecido
        if (data.containsKey("cpf")) {
            process.setCandidateCpf((String) data.get("cpf"));
        }

        // Avanca para proxima etapa
        if (process.getCurrentStep() == 2) {
            process.setCurrentStep(3);
            process.setStatus(AdmissionStatus.DOCUMENTS_PENDING);
        }

        AdmissionProcess saved = admissionRepository.save(process);
        log.info("Dados do candidato salvos: {}", process.getId());

        return mapToResponse(saved);
    }

    /**
     * Lista processos de admissao do tenant com filtros.
     */
    @Transactional(readOnly = true)
    public Page<AdmissionProcessResponse> listProcesses(AdmissionStatus status, String search, Pageable pageable) {
        UUID tenantId = getTenantId();

        if (status != null && search != null && !search.isBlank()) {
            return admissionRepository.findByTenantIdAndStatusAndCandidateNameContainingIgnoreCase(
                    tenantId, status, search, pageable).map(this::mapToResponse);
        } else if (status != null) {
            return admissionRepository.findByTenantIdAndStatus(tenantId, status, pageable).map(this::mapToResponse);
        } else if (search != null && !search.isBlank()) {
            return admissionRepository.findByTenantIdAndCandidateNameContainingIgnoreCase(
                    tenantId, search, pageable).map(this::mapToResponse);
        }

        return admissionRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Lista processos de admissao do tenant.
     */
    @Transactional(readOnly = true)
    public Page<AdmissionProcessResponse> findAll(Pageable pageable) {
        UUID tenantId = getTenantId();
        return admissionRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Obtem processo por ID.
     */
    @Transactional(readOnly = true)
    public AdmissionProcessResponse getProcessById(UUID id) {
        return findById(id);
    }

    /**
     * Obtem entidade do processo por ID.
     */
    @Transactional(readOnly = true)
    public AdmissionProcess getProcessEntityById(UUID id) {
        UUID tenantId = getTenantId();
        return admissionRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));
    }

    /**
     * Lista processos por status.
     */
    @Transactional(readOnly = true)
    public Page<AdmissionProcessResponse> findByStatus(AdmissionStatus status, Pageable pageable) {
        UUID tenantId = getTenantId();
        return admissionRepository.findByTenantIdAndStatus(tenantId, status, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Busca processo por ID.
     */
    @Transactional(readOnly = true)
    public AdmissionProcessResponse findById(UUID id) {
        UUID tenantId = getTenantId();
        AdmissionProcess process = admissionRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));
        return mapToResponse(process);
    }

    /**
     * Valida documentos e avanca etapa.
     */
    @Transactional
    public AdmissionProcessResponse validateDocuments(UUID id, UUID userId) {
        UUID tenantId = getTenantId();
        AdmissionProcess process = admissionRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (process.getDocuments().isEmpty()) {
            throw new InvalidOperationException("Nenhum documento enviado");
        }

        // Valida todos os documentos
        boolean allValid = documentValidationService.validateAllDocuments(process, userId);

        if (allValid) {
            process.setCurrentStep(4);
            process.setStatus(AdmissionStatus.CONTRACT_PENDING);
        } else {
            process.setStatus(AdmissionStatus.DOCUMENTS_VALIDATING);
        }

        AdmissionProcess saved = admissionRepository.save(process);
        return mapToResponse(saved);
    }

    /**
     * T112 - Gera contrato com dados do candidato.
     */
    @Transactional
    public AdmissionProcessResponse generateContract(UUID id, UUID templateId, UUID userId) {
        UUID tenantId = getTenantId();
        AdmissionProcess process = admissionRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (process.getStatus() != AdmissionStatus.CONTRACT_PENDING) {
            throw new InvalidOperationException("Processo nao esta na etapa de contrato");
        }

        // Gera contrato
        String contractUrl = contractService.generateContract(process, templateId);

        process.setContractDocumentUrl(contractUrl);
        process.setContractGeneratedAt(LocalDateTime.now());
        process.setCurrentStep(5);
        process.setStatus(AdmissionStatus.SIGNATURE_PENDING);

        AdmissionProcess saved = admissionRepository.save(process);
        log.info("Contrato gerado para processo: {}", id);

        return mapToResponse(saved);
    }

    /**
     * T113 - Registra assinatura do contrato.
     */
    @Transactional
    public AdmissionProcessResponse registerSignature(UUID id, String signatureId, UUID userId) {
        UUID tenantId = getTenantId();
        AdmissionProcess process = admissionRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (process.getStatus() != AdmissionStatus.SIGNATURE_PENDING) {
            throw new InvalidOperationException("Processo nao esta aguardando assinatura");
        }

        process.setContractSignatureId(signatureId);
        process.setContractSignedAt(LocalDateTime.now());
        process.setStatus(AdmissionStatus.ESOCIAL_PENDING);

        AdmissionProcess saved = admissionRepository.save(process);
        log.info("Assinatura registrada para processo: {}", id);

        return mapToResponse(saved);
    }

    /**
     * T114 - Conclui processo e cria colaborador.
     */
    @Transactional
    public AdmissionProcessResponse completeAdmission(UUID id, UUID userId) {
        UUID tenantId = getTenantId();
        AdmissionProcess process = admissionRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (process.getContractSignedAt() == null) {
            throw new InvalidOperationException("Contrato ainda nao foi assinado");
        }

        // Cria colaborador a partir dos dados do processo
        EmployeeRequest employeeRequest = buildEmployeeRequest(process);
        EmployeeResponse employee = employeeService.create(employeeRequest, userId);

        // Atualiza processo
        Employee emp = new Employee();
        emp.setId(employee.getId());
        process.complete(emp, userId);

        AdmissionProcess saved = admissionRepository.save(process);
        log.info("Admissao concluida: {} - Colaborador: {}", id, employee.getId());

        return mapToResponse(saved);
    }

    /**
     * Cancela processo de admissao.
     */
    @Transactional
    public void cancelProcess(UUID id, UUID userId, String reason) {
        cancelAdmission(id, reason, userId);
    }

    /**
     * Cancela processo de admissao.
     */
    @Transactional
    public void cancelAdmission(UUID id, String reason, UUID userId) {
        UUID tenantId = getTenantId();
        AdmissionProcess process = admissionRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (process.getStatus() == AdmissionStatus.COMPLETED) {
            throw new InvalidOperationException("Processo ja foi concluido");
        }

        process.setStatus(AdmissionStatus.CANCELLED);
        String notes = process.getNotes() != null ? process.getNotes() : "";
        process.setNotes(notes + "\n\nCANCELADO: " + (reason != null ? reason : "Sem motivo informado"));
        process.setCompletedAt(LocalDateTime.now());
        process.setCompletedBy(userId);

        admissionRepository.save(process);
        log.info("Processo de admissao cancelado: {}", id);
    }

    /**
     * Lista documentos do processo.
     */
    @Transactional(readOnly = true)
    public List<AdmissionDocument> getProcessDocuments(UUID processId) {
        UUID tenantId = getTenantId();
        AdmissionProcess process = admissionRepository.findByTenantIdAndId(tenantId, processId)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));
        return process.getDocuments();
    }

    /**
     * Upload de documento do candidato.
     */
    @Transactional
    public AdmissionDocument uploadDocument(String token, MultipartFile file, String documentType, String tenantId) {
        AdmissionProcess process = admissionRepository.findByAccessToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (!process.isLinkValid()) {
            throw new InvalidOperationException("Link expirado");
        }

        // Upload file to storage
        String storagePath = storageService.uploadFile(
                file,
                "admissions/" + process.getId() + "/documents",
                tenantId
        );

        // Create document record
        AdmissionDocument document = new AdmissionDocument();
        document.setAdmissionProcess(process);
        document.setDocumentType(documentType);
        document.setOriginalFileName(file.getOriginalFilename());
        document.setStoragePath(storagePath);
        document.setMimeType(file.getContentType());
        document.setFileSize(file.getSize());

        process.getDocuments().add(document);
        admissionRepository.save(process);

        return document;
    }

    /**
     * Lista documentos do candidato via token.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCandidateDocuments(String token) {
        AdmissionProcess process = admissionRepository.findByAccessTokenWithDocuments(token)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        return process.getDocuments().stream()
                .map(doc -> {
                    Map<String, Object> docInfo = new HashMap<>();
                    docInfo.put("id", doc.getId());
                    docInfo.put("documentType", doc.getDocumentType());
                    docInfo.put("fileName", doc.getOriginalFileName());
                    docInfo.put("status", doc.getValidationStatus());
                    docInfo.put("message", doc.getValidationMessage());
                    docInfo.put("uploadedAt", doc.getCreatedAt());
                    return docInfo;
                })
                .toList();
    }

    /**
     * Retorna status dos documentos obrigatorios.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getRequiredDocumentsStatus(String token) {
        AdmissionProcess process = admissionRepository.findByAccessTokenWithDocuments(token)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        List<String> requiredTypes = List.of("RG", "CPF", "COMPROVANTE_RESIDENCIA", "FOTO_3X4");
        Map<String, String> uploadedDocuments = new HashMap<>();

        for (AdmissionDocument doc : process.getDocuments()) {
            uploadedDocuments.put(doc.getDocumentType(), doc.getValidationStatus().name());
        }

        List<Map<String, Object>> requirements = requiredTypes.stream()
                .map(type -> {
                    Map<String, Object> req = new HashMap<>();
                    req.put("type", type);
                    req.put("required", true);
                    req.put("uploaded", uploadedDocuments.containsKey(type));
                    req.put("status", uploadedDocuments.getOrDefault(type, "PENDING"));
                    return req;
                })
                .toList();

        boolean allUploaded = requiredTypes.stream().allMatch(uploadedDocuments::containsKey);

        return Map.of(
                "requirements", requirements,
                "allRequiredUploaded", allUploaded,
                "totalRequired", requiredTypes.size(),
                "totalUploaded", uploadedDocuments.size()
        );
    }

    /**
     * Valida todos os documentos do processo via token.
     */
    @Transactional
    public Map<String, Object> validateAllDocuments(String token, String tenantId) {
        AdmissionProcess process = admissionRepository.findByAccessTokenWithDocuments(token)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        process.setStatus(AdmissionStatus.DOCUMENTS_VALIDATING);
        admissionRepository.save(process);

        // Process validation
        boolean allValid = documentValidationService.validateAllDocuments(process, null);

        if (allValid) {
            process.setStatus(AdmissionStatus.CONTRACT_PENDING);
            process.setCurrentStep(4);
        }

        admissionRepository.save(process);

        return Map.of(
                "allValid", allValid,
                "status", process.getStatus(),
                "message", allValid ? "Todos os documentos foram validados" : "Alguns documentos precisam de revisao"
        );
    }

    /**
     * Obtem contrato para assinatura.
     */
    @Transactional
    public Map<String, Object> getContractForSignature(String token, String tenantId) {
        AdmissionProcess process = admissionRepository.findByAccessToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (process.getContractDocumentUrl() == null) {
            // Generate contract if not generated yet
            String contractUrl = contractService.generateContract(process, tenantId);
            process.setContractDocumentUrl(contractUrl);
            process.setContractGeneratedAt(LocalDateTime.now());
            admissionRepository.save(process);
        }

        String contractPreview = contractService.getContractPreview(process, tenantId);

        return Map.of(
                "contractUrl", process.getContractDocumentUrl(),
                "contractHtml", contractPreview,
                "generatedAt", process.getContractGeneratedAt(),
                "requiresSignature", true
        );
    }

    /**
     * Registra assinatura do contrato via token.
     */
    @Transactional
    public AdmissionProcessResponse signContract(String token, Map<String, Object> signatureData, String tenantId) {
        AdmissionProcess process = admissionRepository.findByAccessToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (process.getStatus() != AdmissionStatus.CONTRACT_PENDING &&
            process.getStatus() != AdmissionStatus.SIGNATURE_PENDING) {
            throw new InvalidOperationException("Processo nao esta na etapa de assinatura");
        }

        // Verify accepted terms
        if (!Boolean.TRUE.equals(signatureData.get("acceptedTerms"))) {
            throw new InvalidOperationException("E necessario aceitar os termos do contrato");
        }

        // Store signature data
        String signatureId = UUID.randomUUID().toString();
        process.setContractSignatureId(signatureId);
        process.setContractSignedAt(LocalDateTime.now());
        process.setStatus(AdmissionStatus.ESOCIAL_PENDING);

        AdmissionProcess saved = admissionRepository.save(process);
        log.info("Contrato assinado para processo: {}", process.getId());

        return mapToResponse(saved);
    }

    /**
     * Completa admissao com todos os parametros.
     */
    @Transactional
    public AdmissionProcessResponse completeAdmission(UUID id, UUID userId, String tenantId) {
        AdmissionProcessResponse response = completeAdmission(id, userId);

        // Send eSocial event
        AdmissionProcess process = getProcessEntityById(id);
        if (process.getEmployee() != null) {
            try {
                esocialService.sendS2200Event(process.getEmployee(), process, tenantId);
            } catch (Exception e) {
                log.warn("Falha ao enviar evento eSocial: {}", e.getMessage());
                // Don't fail the admission, eSocial can be retried
            }
        }

        return response;
    }

    /**
     * Reenvia link de admissao.
     */
    @Transactional
    public String resendAdmissionLink(UUID id, UUID userId) {
        AdmissionProcessResponse response = resendLink(id, null, userId);
        return response.getPublicLink();
    }

    /**
     * Retorna estatisticas de admissao.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics(String startDate, String endDate) {
        UUID tenantId = getTenantId();

        LocalDateTime start = startDate != null ?
                LocalDate.parse(startDate).atStartOfDay() : LocalDateTime.now().minusMonths(1);
        LocalDateTime end = endDate != null ?
                LocalDate.parse(endDate).atTime(23, 59, 59) : LocalDateTime.now();

        long total = admissionRepository.countByTenantIdAndCreatedAtBetween(tenantId, start, end);
        long completed = admissionRepository.countByTenantIdAndStatusAndCreatedAtBetween(
                tenantId, AdmissionStatus.COMPLETED, start, end);
        long cancelled = admissionRepository.countByTenantIdAndStatusAndCreatedAtBetween(
                tenantId, AdmissionStatus.CANCELLED, start, end);
        long inProgress = admissionRepository.countByTenantIdAndStatusNotInAndCreatedAtBetween(
                tenantId, List.of(AdmissionStatus.COMPLETED, AdmissionStatus.CANCELLED, AdmissionStatus.EXPIRED), start, end);

        double completionRate = total > 0 ? (completed * 100.0 / total) : 0;

        return Map.of(
                "period", Map.of("start", start, "end", end),
                "total", total,
                "completed", completed,
                "cancelled", cancelled,
                "inProgress", inProgress,
                "completionRate", Math.round(completionRate * 100) / 100.0
        );
    }

    /**
     * Conta processos por status.
     */
    @Transactional(readOnly = true)
    public Map<AdmissionStatus, Long> countByStatus() {
        UUID tenantId = getTenantId();
        Map<AdmissionStatus, Long> result = new EnumMap<>(AdmissionStatus.class);

        for (AdmissionStatus status : AdmissionStatus.values()) {
            long count = admissionRepository.countByTenantIdAndStatus(tenantId, status);
            result.put(status, count);
        }

        return result;
    }

    /**
     * Retorna tempo medio de conclusao.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAverageCompletionTime() {
        UUID tenantId = getTenantId();

        List<AdmissionProcess> completedProcesses = admissionRepository.findByTenantIdAndStatus(tenantId, AdmissionStatus.COMPLETED);

        if (completedProcesses.isEmpty()) {
            return Map.of(
                    "averageDays", 0,
                    "averageHours", 0,
                    "sampleSize", 0
            );
        }

        long totalHours = completedProcesses.stream()
                .filter(p -> p.getCompletedAt() != null && p.getCreatedAt() != null)
                .mapToLong(p -> ChronoUnit.HOURS.between(p.getCreatedAt(), p.getCompletedAt()))
                .sum();

        double avgHours = (double) totalHours / completedProcesses.size();
        double avgDays = avgHours / 24;

        return Map.of(
                "averageDays", Math.round(avgDays * 10) / 10.0,
                "averageHours", Math.round(avgHours * 10) / 10.0,
                "sampleSize", completedProcesses.size()
        );
    }

    /**
     * Reenvia link de admissao.
     */
    @Transactional
    public AdmissionProcessResponse resendLink(UUID id, Integer validityDays, UUID userId) {
        UUID tenantId = getTenantId();
        AdmissionProcess process = admissionRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (process.getStatus() == AdmissionStatus.COMPLETED ||
            process.getStatus() == AdmissionStatus.CANCELLED) {
            throw new InvalidOperationException("Processo nao pode ter link reenviado");
        }

        // Gera novo token
        String newToken = generateAccessToken();
        int days = validityDays != null ? validityDays : defaultValidityDays;

        process.setAccessToken(newToken);
        process.setLinkExpiresAt(LocalDateTime.now().plusDays(days));
        process.setLinkAccessedAt(null);

        if (process.getStatus() == AdmissionStatus.EXPIRED) {
            process.setStatus(AdmissionStatus.LINK_GENERATED);
            process.setCurrentStep(1);
        }

        AdmissionProcess saved = admissionRepository.save(process);
        log.info("Link de admissao reenviado: {}", id);

        return mapToResponse(saved);
    }

    // ==================== Metodos Privados ====================

    private UUID getTenantId() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null) {
            throw new IllegalStateException("Tenant nao definido");
        }
        return UUID.fromString(tenant);
    }

    private String generateAccessToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private EmployeeRequest buildEmployeeRequest(AdmissionProcess process) {
        Map<String, Object> data = process.getCandidateData();

        return EmployeeRequest.builder()
                .cpf(process.getCandidateCpf())
                .fullName(process.getCandidateName())
                .email(process.getCandidateEmail())
                .phone(process.getCandidatePhone())
                .birthDate(data != null && data.containsKey("birthDate") ?
                        LocalDate.parse((String) data.get("birthDate")) : null)
                .hireDate(process.getExpectedHireDate() != null ?
                        process.getExpectedHireDate() : LocalDate.now())
                .departmentId(process.getDepartment() != null ? process.getDepartment().getId() : null)
                .positionId(process.getPosition() != null ? process.getPosition().getId() : null)
                .employmentType(EmploymentType.CLT)
                // Outros campos do candidateData...
                .addressStreet(getStringFromData(data, "addressStreet"))
                .addressNumber(getStringFromData(data, "addressNumber"))
                .addressNeighborhood(getStringFromData(data, "addressNeighborhood"))
                .addressCity(getStringFromData(data, "addressCity"))
                .addressState(getStringFromData(data, "addressState"))
                .addressZipCode(getStringFromData(data, "addressZipCode"))
                .build();
    }

    private String getStringFromData(Map<String, Object> data, String key) {
        if (data == null || !data.containsKey(key)) return null;
        return (String) data.get(key);
    }

    private AdmissionProcessResponse mapToResponse(AdmissionProcess process) {
        String publicLink = linkBaseUrl + "/" + process.getAccessToken();

        List<AdmissionProcessResponse.DocumentInfo> documentInfos = process.getDocuments().stream()
                .map(doc -> AdmissionProcessResponse.DocumentInfo.builder()
                        .id(doc.getId())
                        .documentType(doc.getDocumentType())
                        .fileName(doc.getOriginalFileName())
                        .status(doc.getValidationStatus().name())
                        .validationMessage(doc.getValidationMessage())
                        .uploadedAt(doc.getCreatedAt())
                        .hasOcrData(doc.getOcrData() != null)
                        .build())
                .toList();

        int validatedDocs = (int) process.getDocuments().stream()
                .filter(d -> d.getValidationStatus().name().equals("VALID"))
                .count();

        return AdmissionProcessResponse.builder()
                .id(process.getId())
                .tenantId(process.getTenantId())
                .accessToken(process.getAccessToken())
                .publicLink(publicLink)
                .linkExpiresAt(process.getLinkExpiresAt())
                .linkValid(process.isLinkValid())
                .candidateName(process.getCandidateName())
                .candidateEmail(process.getCandidateEmail())
                .candidateCpf(process.getCandidateCpf())
                .candidatePhone(process.getCandidatePhone())
                .expectedHireDate(process.getExpectedHireDate())
                .department(process.getDepartment() != null ?
                        AdmissionProcessResponse.DepartmentInfo.builder()
                                .id(process.getDepartment().getId())
                                .name(process.getDepartment().getName())
                                .build() : null)
                .position(process.getPosition() != null ?
                        AdmissionProcessResponse.PositionInfo.builder()
                                .id(process.getPosition().getId())
                                .title(process.getPosition().getTitle())
                                .build() : null)
                .status(process.getStatus())
                .statusDescription(getStatusDescription(process.getStatus()))
                .currentStep(process.getCurrentStep())
                .totalSteps(5)
                .progressPercent(process.getCurrentStep() * 20.0)
                .documents(documentInfos)
                .pendingDocuments(process.getDocuments().size() - validatedDocs)
                .validatedDocuments(validatedDocs)
                .contractDocumentUrl(process.getContractDocumentUrl())
                .contractGeneratedAt(process.getContractGeneratedAt())
                .contractSignedAt(process.getContractSignedAt())
                .contractSigned(process.getContractSignedAt() != null)
                .esocialEventId(process.getEsocialEventId())
                .esocialSentAt(process.getEsocialSentAt())
                .esocialReceipt(process.getEsocialReceipt())
                .employeeId(process.getEmployee() != null ? process.getEmployee().getId() : null)
                .createdAt(process.getCreatedAt())
                .completedAt(process.getCompletedAt())
                .notes(process.getNotes())
                .build();
    }

    private String getStatusDescription(AdmissionStatus status) {
        return switch (status) {
            case LINK_GENERATED -> "Link enviado, aguardando acesso";
            case DATA_FILLING -> "Candidato preenchendo dados";
            case DOCUMENTS_PENDING -> "Aguardando envio de documentos";
            case DOCUMENTS_VALIDATING -> "Documentos em validacao";
            case CONTRACT_PENDING -> "Aguardando geracao do contrato";
            case SIGNATURE_PENDING -> "Aguardando assinatura";
            case ESOCIAL_PENDING -> "Aguardando envio eSocial";
            case COMPLETED -> "Admissao concluida";
            case CANCELLED -> "Processo cancelado";
            case EXPIRED -> "Link expirado";
            case REJECTED -> "Processo rejeitado";
        };
    }
}
