package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.*;
import com.axonrh.employee.entity.*;
import com.axonrh.employee.entity.enums.*;
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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Servico de gerenciamento do processo de contratacao digital.
 * Controla o fluxo completo desde o disparo (via recrutamento ou manual)
 * ate a criacao do colaborador definitivo.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DigitalHiringService {

    private final DigitalHiringProcessRepository hiringRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final TalentCandidateRepository candidateRepository;
    private final EmployeeService employeeService;
    private final StorageService storageService;
    private final com.axonrh.kafka.producer.DomainEventPublisher eventPublisher;

    @Value("${digital-hiring.link.base-url:http://localhost:3000/contratacao}")
    private String linkBaseUrl;

    @Value("${digital-hiring.link.default-validity-days:7}")
    private int defaultValidityDays;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ==================== Admin (HR) Methods ====================

    /**
     * Cria um novo processo de contratacao digital (manual pelo RH).
     */
    @Transactional
    public DigitalHiringResponse create(DigitalHiringRequest request, UUID userId) {
        UUID tenantId = getTenantId();
        log.info("Criando contratacao digital para: {} - tenant: {}", request.getCandidateEmail(), tenantId);

        // Verifica duplicidade
        if (hiringRepository.existsByTenantIdAndCandidateEmailAndStatusNotIn(
                tenantId, request.getCandidateEmail(),
                List.of(DigitalHiringStatus.COMPLETED, DigitalHiringStatus.CANCELLED))) {
            throw new DuplicateResourceException("Ja existe contratacao digital ativa para este email");
        }

        String accessToken = generateAccessToken();
        int validityDays = request.getLinkValidityDays() != null ? request.getLinkValidityDays() : defaultValidityDays;

        DigitalHiringProcess process = DigitalHiringProcess.builder()
                .tenantId(tenantId)
                .candidateId(request.getCandidateId())
                .vacancyId(request.getVacancyId())
                .accessToken(accessToken)
                .candidateName(request.getCandidateName())
                .candidateEmail(request.getCandidateEmail())
                .candidateCpf(request.getCandidateCpf())
                .candidatePhone(request.getCandidatePhone())
                .employmentType(request.getEmploymentType())
                .baseSalary(request.getBaseSalary())
                .expectedHireDate(request.getExpectedHireDate())
                .linkExpiresAt(LocalDateTime.now().plusDays(validityDays))
                .status(DigitalHiringStatus.ADMISSION_PENDING)
                .currentStep(1)
                .notes(request.getNotes())
                .createdBy(userId)
                .build();

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

        DigitalHiringProcess saved = hiringRepository.save(process);
        log.info("Contratacao digital criada para candiato: {} com ID: {}", request.getCandidateName(), saved.getId());

        // Envia email de convite
        sendInvitationEmail(saved);

        return mapToResponse(saved);
    }

    /**
     * Dispara contratacao digital a partir da aprovacao no recrutamento.
     */
    @Transactional
    public DigitalHiringResponse triggerFromRecruitment(DigitalHiringTriggerRequest request, UUID userId) {
        UUID tenantId = getTenantId();
        log.info("Disparando contratacao digital via recrutamento - candidato: {}", request.getCandidateId());

        // Busca dados do candidato no talent pool
        TalentCandidate candidate = candidateRepository.findByTenantIdAndId(tenantId, request.getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidato nao encontrado"));

        // Verifica se ja existe processo ativo para este candidato
        Optional<DigitalHiringProcess> existingProcess = hiringRepository.findByTenantIdAndCandidateIdAndStatusNotIn(
                tenantId, request.getCandidateId(),
                List.of(DigitalHiringStatus.COMPLETED, DigitalHiringStatus.CANCELLED));

        if (existingProcess.isPresent()) {
            DigitalHiringProcess process = existingProcess.get();
            log.info("Ja existe um processo ativo (ID: {}) para o candidato {}. Atualizando dados.", 
                    process.getId(), candidate.getFullName());
            
            // Atualiza dados básicos do processo com informações atuais do recrutamento
            process.setCandidateName(candidate.getFullName());
            process.setCandidateEmail(candidate.getEmail());
            process.setCandidatePhone(candidate.getPhone());
            process.setVacancyId(request.getVacancyId());
            
            if (candidate.getVacancy() != null) {
                JobVacancy vacancy = candidate.getVacancy();
                if (vacancy.getPosition() != null) {
                    process.setPosition(vacancy.getPosition());
                    if (vacancy.getPosition().getDepartment() != null) {
                        process.setDepartment(vacancy.getPosition().getDepartment());
                    }
                }
                process.setEmploymentType(vacancy.getEmploymentType() != null ?
                        vacancy.getEmploymentType().name() : "CLT");
            }
            
            // Re-valida o link se estiver expirado
            if (!process.isLinkValid()) {
                process.setLinkExpiresAt(LocalDateTime.now().plusDays(defaultValidityDays));
            }
            
            hiringRepository.save(process);
            
            // Reenvia o e-mail de convite (ou envia se não tinha sido enviado)
            sendInvitationEmail(process);
            
            return mapToResponse(process);
        }

        // Monta request a partir dos dados do candidato para novo processo
        DigitalHiringRequest hiringRequest = DigitalHiringRequest.builder()
                .candidateName(candidate.getFullName())
                .candidateEmail(candidate.getEmail())
                .candidatePhone(candidate.getPhone())
                .candidateId(candidate.getId())
                .vacancyId(request.getVacancyId())
                .build();

        // Se candidato tem vaga associada, pega departamento/cargo da vaga
        if (candidate.getVacancy() != null) {
            JobVacancy vacancy = candidate.getVacancy();
            if (vacancy.getPosition() != null) {
                hiringRequest.setPositionId(vacancy.getPosition().getId());
                if (vacancy.getPosition().getDepartment() != null) {
                    hiringRequest.setDepartmentId(vacancy.getPosition().getDepartment().getId());
                }
            }
            hiringRequest.setEmploymentType(vacancy.getEmploymentType() != null ?
                    vacancy.getEmploymentType().name() : "CLT");
        }

        return create(hiringRequest, userId);
    }

    /**
     * Lista processos com filtros.
     */
    @Transactional(readOnly = true)
    public Page<DigitalHiringResponse> list(DigitalHiringStatus status, String search, Pageable pageable) {
        UUID tenantId = getTenantId();
        Page<DigitalHiringProcess> page;

        log.info("Listando contratacoes para o tenant: {}, status: {}, search: {}", tenantId, status, search);
        
        if (status != null && search != null && !search.isBlank()) {
            page = hiringRepository.findByTenantIdAndStatusAndCandidateNameContainingIgnoreCase(
                    tenantId, status, search, pageable);
        } else if (status != null) {
            page = hiringRepository.findByTenantIdAndStatus(tenantId, status, pageable);
        } else if (search != null && !search.isBlank()) {
            page = hiringRepository.findByTenantIdAndCandidateNameContainingIgnoreCase(
                    tenantId, search, pageable);
        } else {
            page = hiringRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
        }

        log.info("Encontradas {} contratacoes digitais para o tenant {}", page.getTotalElements(), tenantId);
        return page.map(this::mapToResponse);
    }

    /**
     * Busca processo por ID.
     */
    @Transactional(readOnly = true)
    public DigitalHiringResponse getById(UUID id) {
        UUID tenantId = getTenantId();
        DigitalHiringProcess process = hiringRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Contratacao digital nao encontrada"));
        return mapToResponse(process);
    }

    /**
     * Estatisticas.
     */
    @Transactional(readOnly = true)
    public DigitalHiringStatsResponse getStats() {
        UUID tenantId = getTenantId();
        return DigitalHiringStatsResponse.builder()
                .total(hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.ADMISSION_PENDING)
                        + hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.DOCUMENTS_PENDING)
                        + hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.DOCUMENTS_VALIDATING)
                        + hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.SIGNATURE_PENDING)
                        + hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.COMPLETED)
                        + hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.CANCELLED))
                .admissionPending(hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.ADMISSION_PENDING))
                .documentsPending(hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.DOCUMENTS_PENDING))
                .documentsValidating(hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.DOCUMENTS_VALIDATING))
                .signaturePending(hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.SIGNATURE_PENDING))
                .completed(hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.COMPLETED))
                .cancelled(hiringRepository.countByTenantIdAndStatus(tenantId, DigitalHiringStatus.CANCELLED))
                .averageCompletionDays(Optional.ofNullable(hiringRepository.getAverageCompletionDays(tenantId)).orElse(0.0))
                .build();
    }

    /**
     * Reenviar email.
     */
    @Transactional
    public Map<String, String> resendEmail(UUID id, UUID userId) {
        UUID tenantId = getTenantId();
        DigitalHiringProcess process = hiringRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Contratacao digital nao encontrada"));

        // Renova link se expirou
        if (!process.isLinkValid()) {
            process.setLinkExpiresAt(LocalDateTime.now().plusDays(defaultValidityDays));
            hiringRepository.save(process);
        }

        String publicLink = linkBaseUrl + "/" + process.getAccessToken();
        log.info("Reenviando email de contratacao digital: {} para: {}", id, process.getCandidateEmail());

        sendInvitationEmail(process);

        return Map.of("message", "Email reenviado com sucesso", "link", publicLink);
    }

    /**
     * Atualiza o e-mail do candidato e reenvia o convite.
     */
    @Transactional
    public void updateEmail(UUID id, String newEmail) {
        UUID tenantId = getTenantId();
        DigitalHiringProcess process = hiringRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Contratacao digital nao encontrada"));

        log.info("Atualizando e-mail da contratacao digital: {} de: {} para: {}", id, process.getCandidateEmail(), newEmail);
        process.setCandidateEmail(newEmail);
        
        // Renova link por seguranca ao trocar e-mail
        process.setAccessToken(UUID.randomUUID().toString().replace("-", ""));
        process.setLinkExpiresAt(LocalDateTime.now().plusDays(defaultValidityDays));
        
        hiringRepository.save(process);
        
        // Reenvia o convite com o novo e-mail
        sendInvitationEmail(process);
    }

    /**
     * Envia o e-mail de convite via Kafka.
     */
    private void sendInvitationEmail(DigitalHiringProcess process) {
        try {
            String publicLink = linkBaseUrl + "/" + process.getAccessToken();
            Map<String, Object> variables = new HashMap<>();
            variables.put("candidate_name", process.getCandidateName());
            variables.put("company_name", "AxonRH"); // Seria ideal buscar o nome do tenant
            variables.put("hiring_link", publicLink);
            variables.put("expires_at", process.getLinkExpiresAt().toString());

            com.axonrh.kafka.event.notification.NotificationEvent event = com.axonrh.kafka.event.notification.NotificationEvent.create()
                    .tenantId(process.getTenantId())
                    .externalEmails(List.of(process.getCandidateEmail()))
                    .channels(List.of("EMAIL"))
                    .templateCode("DIGITAL_HIRING_INVITATION")
                    .title("Bem-vindo ao processo de admissão - AxonRH")
                    .variables(variables)
                    .build();

            eventPublisher.publish(event);
            log.info("Evento de convite de contratacao digital enviado para: {}", process.getCandidateEmail());
        } catch (Exception e) {
            log.error("Erro ao disparar evento de e-mail para contratacao digital: {}", e.getMessage());
        }
    }

    /**
     * Forcar avanco de etapa.
     */
    @Transactional
    public DigitalHiringResponse forceAdvance(UUID id, UUID userId) {
        UUID tenantId = getTenantId();
        DigitalHiringProcess process = hiringRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Contratacao digital nao encontrada"));

        switch (process.getStatus()) {
            case ADMISSION_PENDING -> process.advanceToDocuments();
            case DOCUMENTS_PENDING -> process.advanceToValidation();
            case DOCUMENTS_VALIDATING -> process.advanceToSignature();
            case SIGNATURE_PENDING -> completeProcess(process);
            default -> throw new InvalidOperationException("Nao e possivel avancar neste status");
        }

        hiringRepository.save(process);
        return mapToResponse(process);
    }

    /**
     * Solicitar correcao.
     */
    @Transactional
    public void requestCorrection(UUID id, String message) {
        UUID tenantId = getTenantId();
        DigitalHiringProcess process = hiringRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Contratacao digital nao encontrada"));

        log.info("Solicitando correcao para contratacao digital: {} - motivo: {}", id, message);
        // TODO: Enviar notificacao via notification-service
    }

    /**
     * Cancelar processo.
     */
    @Transactional
    public void cancel(UUID id, String reason) {
        UUID tenantId = getTenantId();
        DigitalHiringProcess process = hiringRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Contratacao digital nao encontrada"));

        if (process.getStatus() == DigitalHiringStatus.COMPLETED) {
            throw new InvalidOperationException("Nao e possivel cancelar processo ja concluido");
        }

        process.cancel(reason);
        hiringRepository.save(process);
        log.info("Contratacao digital cancelada: {} - motivo: {}", id, reason);
    }

    // ==================== Public (Candidate Portal) Methods ====================

    /**
     * Acesso publico via token.
     */
    @Transactional
    public DigitalHiringResponse accessByToken(String token) {
        DigitalHiringProcess process = hiringRepository.findByAccessTokenWithDocuments(token)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (!process.isLinkValid()) {
            throw new InvalidOperationException("Link expirado");
        }

        if (process.getLinkAccessedAt() == null) {
            process.setLinkAccessedAt(LocalDateTime.now());
            hiringRepository.save(process);
        }

        return mapToResponse(process);
    }

    /**
     * Criar senha (primeiro acesso).
     */
    @Transactional
    public Map<String, String> createPassword(String token, String cpf, String password) {
        DigitalHiringProcess process = getProcessByToken(token);

        // Valida CPF se informado no processo
        if (process.getCandidateCpf() != null && !process.getCandidateCpf().equals(cpf.replaceAll("\\D", ""))) {
            throw new InvalidOperationException("CPF nao confere");
        }

        process.setPasswordHash(hashPassword(password));
        process.setCandidateCpf(cpf.replaceAll("\\D", ""));
        hiringRepository.save(process);

        return Map.of("sessionToken", token); // Simplificado — usa o proprio token como sessao
    }

    /**
     * Login (acessos subsequentes).
     */
    @Transactional(readOnly = true)
    public Map<String, String> login(String token, String cpf, String password) {
        DigitalHiringProcess process = getProcessByToken(token);

        if (process.getPasswordHash() == null) {
            throw new InvalidOperationException("Primeiro acesso - crie uma senha");
        }

        if (!hashPassword(password).equals(process.getPasswordHash())) {
            throw new InvalidOperationException("Senha incorreta");
        }

        return Map.of("sessionToken", token);
    }

    /**
     * Salvar dados pessoais (Etapa 1).
     */
    @Transactional
    public void savePersonalData(String token, Map<String, Object> data) {
        DigitalHiringProcess process = getProcessByToken(token);
        process.setPersonalData(data);

        if (process.getStatus() == DigitalHiringStatus.ADMISSION_PENDING) {
            process.advanceToDocuments();
        }

        hiringRepository.save(process);
        log.info("Dados pessoais salvos para contratacao: {}", process.getId());
    }

    /**
     * Upload de documento (Etapa 2).
     */
    @Transactional
    public Map<String, Object> uploadDocument(String token, MultipartFile file, String documentType) {
        DigitalHiringProcess process = getProcessByToken(token);

        // Remove documento anterior do mesmo tipo
        process.getDocuments().removeIf(d -> d.getDocumentType().equals(documentType));

        DigitalHiringDocument document = DigitalHiringDocument.builder()
                .tenantId(process.getTenantId())
                .digitalHiringProcess(process)
                .documentType(documentType)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .validationStatus("UPLOADED")
                .build();

        // Salvar arquivo via MinIO
        try {
            String path = "digital-hiring/" + process.getId() + "/" + documentType + "_" + file.getOriginalFilename();
            String filePath = storageService.uploadFile(
                    file.getBytes(), path, file.getContentType(), process.getTenantId().toString());
            document.setFilePath(filePath);
        } catch (Exception e) {
            log.warn("Falha ao armazenar arquivo, salvando referencia: {}", e.getMessage());
        }

        process.addDocument(document);

        if (process.getStatus() == DigitalHiringStatus.ADMISSION_PENDING) {
            process.advanceToDocuments();
        }

        hiringRepository.save(process);

        // TODO: Chamar ia-assistant-service para OCR e validacao

        return Map.of(
                "documentId", document.getId() != null ? document.getId().toString() : "",
                "validationStatus", document.getValidationStatus(),
                "ocrData", document.getOcrData() != null ? document.getOcrData() : Map.of()
        );
    }

    /**
     * Listar documentos do candidato.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDocuments(String token) {
        DigitalHiringProcess process = hiringRepository.findByAccessTokenWithDocuments(token)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        return process.getDocuments().stream().map(doc -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", doc.getId());
            map.put("documentType", doc.getDocumentType());
            map.put("fileName", doc.getFileName());
            map.put("fileSize", doc.getFileSize());
            map.put("status", doc.getValidationStatus());
            map.put("validationMessage", doc.getValidationMessage());
            map.put("uploadedAt", doc.getUploadedAt());
            map.put("validatedAt", doc.getValidatedAt());
            return map;
        }).toList();
    }

    /**
     * Validar todos os documentos (Etapa 2 -> 3).
     */
    @Transactional
    public Map<String, Object> validateDocuments(String token) {
        DigitalHiringProcess process = getProcessByToken(token);

        // Marca documentos como validados (simplificado — seria via IA)
        boolean allValid = true;
        List<Map<String, Object>> alerts = new ArrayList<>();

        for (DigitalHiringDocument doc : process.getDocuments()) {
            if ("UPLOADED".equals(doc.getValidationStatus())) {
                doc.setValidationStatus("VALID");
                doc.setValidatedAt(LocalDateTime.now());
            }
            if (!"VALID".equals(doc.getValidationStatus())) {
                allValid = false;
            }
        }

        if (allValid && !process.getDocuments().isEmpty()) {
            process.setStatus(DigitalHiringStatus.DOCUMENTS_VALIDATING);
            process.setCurrentStep(3);
        }

        hiringRepository.save(process);

        return Map.of("allValid", allValid, "alerts", alerts);
    }

    /**
     * Salvar dados trabalhistas (Etapa 3).
     */
    @Transactional
    public void saveWorkData(String token, Map<String, Object> data) {
        DigitalHiringProcess process = getProcessByToken(token);
        process.setWorkData(data);

        if (process.getStatus() == DigitalHiringStatus.DOCUMENTS_VALIDATING ||
                process.getStatus() == DigitalHiringStatus.DOCUMENTS_PENDING) {
            process.advanceToSignature();
        }

        hiringRepository.save(process);
        log.info("Dados trabalhistas salvos para contratacao: {}", process.getId());
    }

    /**
     * Buscar contrato para assinatura (Etapa 4).
     */
    @Transactional(readOnly = true)
    public Map<String, String> getContract(String token) {
        DigitalHiringProcess process = getProcessByToken(token);

        String contractHtml = process.getContractHtml();
        if (contractHtml == null || contractHtml.isBlank()) {
            // Gerar contrato padrao se nao existir
            contractHtml = generateDefaultContract(process);
        }

        return Map.of(
                "contractHtml", contractHtml,
                "confidentialityHtml", process.getConfidentialityHtml() != null ?
                        process.getConfidentialityHtml() : generateDefaultConfidentiality(process),
                "policyHtml", process.getPolicyHtml() != null ?
                        process.getPolicyHtml() : generateDefaultPolicy()
        );
    }

    /**
     * Assinar contrato (Etapa 4 -> 5).
     */
    @Transactional
    public void signContract(String token, DigitalHiringSignatureRequest request) {
        DigitalHiringProcess process = getProcessByToken(token);

        if (!request.isAcceptedTerms() || !request.isAcceptedConfidentiality() || !request.isAcceptedInternalPolicy()) {
            throw new InvalidOperationException("Todos os termos devem ser aceitos");
        }

        process.setContractSigned(true);
        process.setContractSignedAt(LocalDateTime.now());
        process.setSignatureIp(request.getIpAddress());
        process.setSignatureUserAgent(request.getUserAgent());

        // Gerar contrato se nao gerado
        if (process.getContractHtml() == null) {
            process.setContractHtml(generateDefaultContract(process));
            process.setContractGeneratedAt(LocalDateTime.now());
        }

        // Completar processo — criar colaborador
        completeProcess(process);

        hiringRepository.save(process);
        log.info("Contrato assinado e contratacao concluida: {}", process.getId());
    }

    /**
     * Chat IA (assistente para o candidato).
     */
    public Map<String, Object> aiChat(String token, String message) {
        // TODO: Integrar com ia-assistant-service via Feign
        return Map.of(
                "role", "assistant",
                "content", "Estou aqui para ajudar! Para duvidas mais especificas sobre o processo de contratacao, " +
                        "entre em contato com o RH pelo e-mail informado.",
                "timestamp", LocalDateTime.now().toString()
        );
    }

    /**
     * Validacao IA dos dados.
     */
    public Map<String, Object> validateData(String token) {
        DigitalHiringProcess process = getProcessByToken(token);

        // TODO: Chamar ia-assistant-service para validacao completa
        // Por enquanto retorna score ficticio
        int score = 85;
        List<Map<String, Object>> alerts = new ArrayList<>();

        process.setAiConsistencyScore(score);
        process.setAiAlerts(alerts);
        hiringRepository.save(process);

        return Map.of(
                "consistencyScore", score,
                "alerts", alerts,
                "suggestions", List.of()
        );
    }

    /**
     * Analise IA (para o RH).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAiAnalysis(UUID id) {
        UUID tenantId = getTenantId();
        DigitalHiringProcess process = hiringRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Contratacao digital nao encontrada"));

        return Map.of(
                "consistencyScore", process.getAiConsistencyScore() != null ? process.getAiConsistencyScore() : 0,
                "alerts", process.getAiAlerts() != null ? process.getAiAlerts() : List.of(),
                "suggestions", List.of()
        );
    }

    /**
     * Gerar contrato via IA.
     */
    @Transactional
    public Map<String, String> generateContract(UUID id) {
        UUID tenantId = getTenantId();
        DigitalHiringProcess process = hiringRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Contratacao digital nao encontrada"));

        // TODO: Chamar ia-assistant-service para gerar contrato personalizado
        String contractHtml = generateDefaultContract(process);
        process.setContractHtml(contractHtml);
        process.setContractGeneratedAt(LocalDateTime.now());
        hiringRepository.save(process);

        return Map.of("contractHtml", contractHtml);
    }

    // ==================== Internal Methods ====================

    /**
     * Completa o processo criando o colaborador no employee-service.
     */
    private void completeProcess(DigitalHiringProcess process) {
        try {
            // Construir request de criacao de colaborador
            EmployeeRequest employeeRequest = buildEmployeeRequest(process);
            EmployeeResponse employeeResponse = employeeService.create(employeeRequest, process.getCreatedBy());

            // Marcar como completo (sem Employee entity direta, usamos o ID)
            process.setStatus(DigitalHiringStatus.COMPLETED);
            process.setCurrentStep(5);
            process.setCompletedAt(LocalDateTime.now());
            process.setRegistrationNumber(employeeResponse.getRegistrationNumber());

            // Atualizar status no recrutamento para HIRED
            if (process.getCandidateId() != null) {
                try {
                    TalentCandidate candidate = candidateRepository
                            .findByTenantIdAndId(process.getTenantId(), process.getCandidateId())
                            .orElse(null);
                    if (candidate != null) {
                        candidate.updateStatus(CandidateStatus.HIRED, "Contratacao digital concluida", null);
                        candidateRepository.save(candidate);
                    }
                } catch (Exception e) {
                    log.warn("Falha ao atualizar status do candidato: {}", e.getMessage());
                }
            }

            log.info("Colaborador criado via contratacao digital: {} -> employee: {}",
                    process.getId(), employeeResponse.getId());
        } catch (Exception e) {
            log.error("Falha ao criar colaborador na contratacao digital: {}", process.getId(), e);
            // Nao falha o processo — RH pode completar manualmente
            process.setStatus(DigitalHiringStatus.COMPLETED);
            process.setCurrentStep(5);
            process.setCompletedAt(LocalDateTime.now());
        }
    }

    /**
     * Constroi EmployeeRequest a partir dos dados da contratacao.
     */
    private EmployeeRequest buildEmployeeRequest(DigitalHiringProcess process) {
        Map<String, Object> pd = process.getPersonalData() != null ? process.getPersonalData() : Map.of();

        EmployeeRequest.EmployeeRequestBuilder builder = EmployeeRequest.builder()
                .cpf(process.getCandidateCpf())
                .fullName(process.getCandidateName())
                .email(process.getCandidateEmail())
                .phone(pd.get("phone") != null ? String.valueOf(pd.get("phone")) : process.getCandidatePhone())
                .birthDate(pd.get("birthDate") != null ? LocalDate.parse(String.valueOf(pd.get("birthDate"))) : null)
                .hireDate(process.getExpectedHireDate() != null ? process.getExpectedHireDate() : LocalDate.now())
                .departmentId(process.getDepartment() != null ? process.getDepartment().getId() : null)
                .positionId(process.getPosition() != null ? process.getPosition().getId() : null)
                .baseSalary(process.getBaseSalary());

        // Employment Type (Crucial para evitar erro NOT NULL)
        try {
            if (process.getEmploymentType() != null) {
                builder.employmentType(EmploymentType.valueOf(process.getEmploymentType()));
            } else {
                builder.employmentType(EmploymentType.CLT);
            }
        } catch (Exception e) {
            builder.employmentType(EmploymentType.CLT);
        }

        // Dados Pessoais Adicionais
        try {
            if (pd.get("gender") != null) {
                builder.gender(Gender.valueOf(String.valueOf(pd.get("gender"))));
            }
            if (pd.get("maritalStatus") != null) {
                builder.maritalStatus(MaritalStatus.valueOf(String.valueOf(pd.get("maritalStatus"))));
            }
        } catch (Exception e) {
            log.warn("Erro ao mapear enums de dados pessoais: {}", e.getMessage());
        }

        // Endereço
        builder.addressZipCode(pd.get("cep") != null ? String.valueOf(pd.get("cep")).replaceAll("[^0-9]", "") : null)
                .addressStreet(pd.get("logradouro") != null ? String.valueOf(pd.get("logradouro")) : null)
                .addressNumber(pd.get("numero") != null ? String.valueOf(pd.get("numero")) : null)
                .addressComplement(pd.get("complemento") != null ? String.valueOf(pd.get("complemento")) : null)
                .addressNeighborhood(pd.get("bairro") != null ? String.valueOf(pd.get("bairro")) : null)
                .addressCity(pd.get("cidade") != null ? String.valueOf(pd.get("cidade")) : null)
                .addressState(pd.get("estado") != null ? String.valueOf(pd.get("estado")) : null);

        return builder.build();
    }

    /**
     * Hash simples de senha para o portal do candidato.
     */
    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 nao disponivel", e);
        }
    }

    private DigitalHiringProcess getProcessByToken(String token) {
        DigitalHiringProcess process = hiringRepository.findByAccessToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Processo nao encontrado"));

        if (!process.isLinkValid() && process.getStatus() != DigitalHiringStatus.COMPLETED) {
            throw new InvalidOperationException("Link expirado");
        }

        return process;
    }

    private String generateAccessToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private UUID getTenantId() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null) {
            throw new IllegalStateException("Tenant nao definido");
        }
        return UUID.fromString(tenant);
    }

    private String generateDefaultContract(DigitalHiringProcess process) {
        String position = process.getPosition() != null ? process.getPosition().getTitle() : "a definir";
        String department = process.getDepartment() != null ? process.getDepartment().getName() : "a definir";
        String salary = process.getBaseSalary() != null ? "R$ " + process.getBaseSalary().toString() : "a definir";

        return """
                <h2>CONTRATO DE TRABALHO</h2>
                <p><strong>CONTRATANTE:</strong> [Empresa]</p>
                <p><strong>CONTRATADO(A):</strong> %s, CPF %s</p>
                <p><strong>CARGO:</strong> %s</p>
                <p><strong>DEPARTAMENTO:</strong> %s</p>
                <p><strong>SALARIO:</strong> %s</p>
                <p><strong>TIPO:</strong> %s</p>
                <p><strong>DATA INICIO:</strong> %s</p>
                <hr/>
                <p>O presente contrato regulamenta a relacao de trabalho entre as partes acima identificadas,
                nos termos da Consolidacao das Leis do Trabalho (CLT) e demais disposicoes legais aplicaveis.</p>
                <p>O(A) CONTRATADO(A) exercera as funcoes de %s no departamento de %s,
                cumprindo jornada de trabalho conforme legislacao vigente.</p>
                <p>Este contrato entra em vigor na data de inicio acima especificada.</p>
                """.formatted(
                process.getCandidateName(),
                process.getCandidateCpf() != null ? process.getCandidateCpf() : "___",
                position, department, salary,
                process.getEmploymentType() != null ? process.getEmploymentType() : "CLT",
                process.getExpectedHireDate() != null ? process.getExpectedHireDate().toString() : "a definir",
                position, department
        );
    }

    private String generateDefaultConfidentiality(DigitalHiringProcess process) {
        return """
                <h2>TERMO DE CONFIDENCIALIDADE</h2>
                <p>Eu, <strong>%s</strong>, comprometo-me a manter sigilo absoluto sobre todas as informacoes
                confidenciais e/ou privilegiadas a que tiver acesso no exercicio de minhas funcoes.</p>
                <p>Este compromisso abrange informacoes tecnicas, comerciais, financeiras e estrategicas
                da empresa, seus clientes e parceiros.</p>
                <p>O descumprimento deste termo podera resultar em sancoes disciplinares e legais conforme
                legislacao vigente.</p>
                """.formatted(process.getCandidateName());
    }

    private String generateDefaultPolicy() {
        return """
                <h2>POLITICA INTERNA</h2>
                <p>Ao aceitar este termo, declaro estar ciente e de acordo com as politicas internas da empresa,
                incluindo:</p>
                <ul>
                <li>Codigo de etica e conduta</li>
                <li>Politica de seguranca da informacao</li>
                <li>Politica de uso de recursos de TI</li>
                <li>Regulamento interno de trabalho</li>
                </ul>
                <p>Comprometo-me a cumprir integralmente todas as normas estabelecidas.</p>
                """;
    }

    // ==================== Mapper ====================

    private DigitalHiringResponse mapToResponse(DigitalHiringProcess process) {
        String publicLink = linkBaseUrl + "/" + process.getAccessToken();

        DigitalHiringResponse.DepartmentInfo deptInfo = null;
        if (process.getDepartment() != null) {
            deptInfo = DigitalHiringResponse.DepartmentInfo.builder()
                    .id(process.getDepartment().getId())
                    .name(process.getDepartment().getName())
                    .build();
        }

        DigitalHiringResponse.PositionInfo posInfo = null;
        if (process.getPosition() != null) {
            posInfo = DigitalHiringResponse.PositionInfo.builder()
                    .id(process.getPosition().getId())
                    .title(process.getPosition().getTitle())
                    .build();
        }

        List<DigitalHiringResponse.DocumentInfo> docInfos = process.getDocuments().stream()
                .map(doc -> DigitalHiringResponse.DocumentInfo.builder()
                        .id(doc.getId())
                        .documentType(doc.getDocumentType())
                        .fileName(doc.getFileName())
                        .fileSize(doc.getFileSize())
                        .status(doc.getValidationStatus())
                        .validationMessage(doc.getValidationMessage())
                        .ocrData(doc.getOcrData())
                        .uploadedAt(doc.getUploadedAt())
                        .validatedAt(doc.getValidatedAt())
                        .build())
                .toList();

        return DigitalHiringResponse.builder()
                .id(process.getId())
                .tenantId(process.getTenantId())
                .candidateId(process.getCandidateId())
                .vacancyId(process.getVacancyId())
                .accessToken(process.getAccessToken())
                .publicLink(publicLink)
                .linkExpiresAt(process.getLinkExpiresAt())
                .linkValid(process.isLinkValid())
                .candidateName(process.getCandidateName())
                .candidateEmail(process.getCandidateEmail())
                .candidateCpf(process.getCandidateCpf())
                .candidatePhone(process.getCandidatePhone())
                .department(deptInfo)
                .position(posInfo)
                .employmentType(process.getEmploymentType())
                .baseSalary(process.getBaseSalary())
                .expectedHireDate(process.getExpectedHireDate())
                .status(process.getStatus())
                .currentStep(process.getCurrentStep())
                .totalSteps(process.getTotalSteps())
                .progressPercent(process.getProgressPercent())
                .personalData(process.getPersonalData())
                .workData(process.getWorkData())
                .documents(docInfos)
                .pendingDocuments(process.getPendingDocuments())
                .validatedDocuments(process.getValidatedDocuments())
                .contractHtml(process.getContractHtml())
                .contractGeneratedAt(process.getContractGeneratedAt())
                .contractSignedAt(process.getContractSignedAt())
                .contractSigned(process.getContractSigned())
                .signatureIp(process.getSignatureIp())
                .signatureUserAgent(process.getSignatureUserAgent())
                .signatureTimestamp(process.getContractSignedAt() != null ? process.getContractSignedAt().toString() : null)
                .aiConsistencyScore(process.getAiConsistencyScore())
                .aiAlerts(process.getAiAlerts())
                .employeeId(process.getEmployee() != null ? process.getEmployee().getId() : null)
                .registrationNumber(process.getRegistrationNumber())
                .createdAt(process.getCreatedAt())
                .updatedAt(process.getUpdatedAt())
                .completedAt(process.getCompletedAt())
                .cancelledAt(process.getCancelledAt())
                .cancelReason(process.getCancelReason())
                .notes(process.getNotes())
                .build();
    }
}
