package com.axonrh.employee.service;

import com.axonrh.employee.client.ResumeAnalysisClient;
import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.*;
import com.axonrh.employee.entity.JobVacancy;
import com.axonrh.employee.entity.Position;
import com.axonrh.employee.entity.TalentCandidate;
import com.axonrh.employee.entity.enums.CandidateStatus;
import com.axonrh.employee.entity.enums.VacancyStatus;
import com.axonrh.employee.exception.DuplicateResourceException;
import com.axonrh.employee.exception.InvalidOperationException;
import com.axonrh.employee.exception.ResourceNotFoundException;
import com.axonrh.employee.mapper.JobVacancyMapper;
import com.axonrh.employee.mapper.TalentCandidateMapper;
import com.axonrh.employee.repository.JobVacancyRepository;
import com.axonrh.employee.repository.PositionRepository;
import com.axonrh.employee.repository.TalentCandidateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service para gerenciamento do Banco de Talentos.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TalentPoolService {

    private final JobVacancyRepository vacancyRepository;
    private final TalentCandidateRepository candidateRepository;
    private final PositionRepository positionRepository;
    private final JobVacancyMapper vacancyMapper;
    private final TalentCandidateMapper candidateMapper;
    private final ResumeAnalysisClient resumeAnalysisClient;

    private static final String UPLOAD_DIR = "uploads/resumes";

    // ==================== VAGAS ====================

    /**
     * Lista todas as vagas do tenant
     */
    @Transactional(readOnly = true)
    public List<JobVacancyResponse> findAllVacancies() {
        UUID tenantId = getTenantId();
        return vacancyRepository.findByTenantIdAndIsActiveTrueOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::toResponseWithCandidateCount)
                .collect(Collectors.toList());
    }

    /**
     * Lista vagas paginadas
     */
    @Transactional(readOnly = true)
    public Page<JobVacancyResponse> findAllVacancies(Pageable pageable) {
        UUID tenantId = getTenantId();
        return vacancyRepository.findByTenantIdAndIsActiveTrue(tenantId, pageable)
                .map(this::toResponseWithCandidateCount);
    }

    /**
     * Lista vagas por status
     */
    @Transactional(readOnly = true)
    public List<JobVacancyResponse> findVacanciesByStatus(VacancyStatus status) {
        UUID tenantId = getTenantId();
        return vacancyRepository.findByTenantIdAndStatusAndIsActiveTrueOrderByCreatedAtDesc(tenantId, status)
                .stream()
                .map(this::toResponseWithCandidateCount)
                .collect(Collectors.toList());
    }

    /**
     * Busca vaga por ID
     */
    @Transactional(readOnly = true)
    public JobVacancyResponse findVacancyById(UUID id) {
        UUID tenantId = getTenantId();
        JobVacancy vacancy = vacancyRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada: " + id));
        return toResponseWithCandidateCount(vacancy);
    }

    /**
     * Busca vaga pública por código
     */
    @Transactional(readOnly = true)
    public PublicVacancyResponse findPublicVacancy(String publicCode) {
        JobVacancy vacancy = vacancyRepository.findByPublicCodeAndStatus(publicCode, VacancyStatus.OPEN)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada ou não está aberta: " + publicCode));

        // Verifica se passou da deadline
        if (vacancy.getDeadline() != null && vacancy.getDeadline().isBefore(LocalDate.now())) {
            throw new InvalidOperationException("O prazo para candidatura a esta vaga já expirou");
        }

        // TODO: Buscar nome e logo da empresa do tenant
        String companyName = "Empresa"; // Placeholder
        String companyLogo = null;

        return vacancyMapper.toPublicResponse(vacancy, companyName, companyLogo);
    }

    /**
     * Lista vagas abertas (público)
     */
    @Transactional(readOnly = true)
    public List<PublicVacancyResponse> findOpenVacancies() {
        return vacancyRepository.findAllOpenVacancies()
                .stream()
                .map(v -> vacancyMapper.toPublicResponse(v, "Empresa", null))
                .collect(Collectors.toList());
    }

    /**
     * Cria uma nova vaga
     */
    public JobVacancyResponse createVacancy(JobVacancyRequest request, UUID userId) {
        UUID tenantId = getTenantId();

        Position position = positionRepository.findByTenantIdAndId(tenantId, request.getPositionId())
                .orElseThrow(() -> new ResourceNotFoundException("Cargo não encontrado: " + request.getPositionId()));

        JobVacancy vacancy = vacancyMapper.toEntity(request, position);
        vacancy.setTenantId(tenantId);
        vacancy.setCreatedBy(userId);

        // Preenche campos do cargo se não informados
        if (vacancy.getDescription() == null || vacancy.getDescription().isBlank()) {
            vacancy.setDescription(position.getDescription());
        }
        if (vacancy.getResponsibilities() == null || vacancy.getResponsibilities().isBlank()) {
            vacancy.setResponsibilities(position.getResponsibilities());
        }

        vacancy = vacancyRepository.save(vacancy);
        log.info("Vaga criada: {} para cargo {}", vacancy.getId(), position.getTitle());

        return vacancyMapper.toResponse(vacancy);
    }

    /**
     * Atualiza uma vaga
     */
    public JobVacancyResponse updateVacancy(UUID id, JobVacancyRequest request, UUID userId) {
        UUID tenantId = getTenantId();

        JobVacancy vacancy = vacancyRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada: " + id));

        Position position = positionRepository.findByTenantIdAndId(tenantId, request.getPositionId())
                .orElseThrow(() -> new ResourceNotFoundException("Cargo não encontrado: " + request.getPositionId()));

        vacancyMapper.updateEntity(vacancy, request, position);
        vacancy.setUpdatedBy(userId);

        vacancy = vacancyRepository.save(vacancy);
        log.info("Vaga atualizada com sucesso no banco: {}", id);

        return toResponseWithCandidateCount(vacancy);
    }

    /**
     * Publica uma vaga
     */
    public JobVacancyResponse publishVacancy(UUID id, UUID userId) {
        UUID tenantId = getTenantId();

        JobVacancy vacancy = vacancyRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada: " + id));

        if (vacancy.getStatus() == VacancyStatus.OPEN) {
            throw new InvalidOperationException("A vaga já está publicada");
        }

        vacancy.publish();
        vacancy.setUpdatedBy(userId);

        // Garante código público único
        while (vacancyRepository.existsByPublicCode(vacancy.getPublicCode())) {
            vacancy.setPublicCode(null);
            vacancy.generatePublicCode();
        }

        vacancy = vacancyRepository.save(vacancy);
        log.info("Vaga publicada com sucesso no banco: {} - Código público: {}", id, vacancy.getPublicCode());

        return toResponseWithCandidateCount(vacancy);
    }

    /**
     * Pausa uma vaga
     */
    public JobVacancyResponse pauseVacancy(UUID id, UUID userId) {
        UUID tenantId = getTenantId();

        JobVacancy vacancy = vacancyRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada: " + id));

        if (vacancy.getStatus() != VacancyStatus.OPEN) {
            throw new InvalidOperationException("Apenas vagas abertas podem ser pausadas");
        }

        vacancy.setStatus(VacancyStatus.PAUSED);
        vacancy.setUpdatedBy(userId);

        vacancy = vacancyRepository.save(vacancy);
        log.info("Vaga pausada: {}", id);

        return toResponseWithCandidateCount(vacancy);
    }

    /**
     * Reabre uma vaga pausada
     */
    public JobVacancyResponse reopenVacancy(UUID id, UUID userId) {
        UUID tenantId = getTenantId();

        JobVacancy vacancy = vacancyRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada: " + id));

        if (vacancy.getStatus() != VacancyStatus.PAUSED) {
            throw new InvalidOperationException("Apenas vagas pausadas podem ser reabertas");
        }

        vacancy.setStatus(VacancyStatus.OPEN);
        vacancy.setUpdatedBy(userId);

        vacancy = vacancyRepository.save(vacancy);
        log.info("Vaga reaberta: {}", id);

        return toResponseWithCandidateCount(vacancy);
    }

    /**
     * Fecha uma vaga
     */
    public JobVacancyResponse closeVacancy(UUID id, UUID userId) {
        UUID tenantId = getTenantId();

        JobVacancy vacancy = vacancyRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada: " + id));

        vacancy.close();
        vacancy.setUpdatedBy(userId);

        vacancy = vacancyRepository.save(vacancy);
        log.info("Vaga fechada: {}", id);

        return toResponseWithCandidateCount(vacancy);
    }

    /**
     * Exclui uma vaga (soft delete)
     */
    public void deleteVacancy(UUID id) {
        UUID tenantId = getTenantId();

        JobVacancy vacancy = vacancyRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada: " + id));

        vacancy.setIsActive(false);
        vacancyRepository.save(vacancy);
        log.info("Vaga excluída: {}", id);
    }

    // ==================== CANDIDATOS ====================

    /**
     * Lista todos os candidatos do tenant
     */
    @Transactional(readOnly = true)
    public List<TalentCandidateResponse> findAllCandidates() {
        UUID tenantId = getTenantId();
        return candidateRepository.findByTenantIdAndIsActiveTrueOrderByAppliedAtDesc(tenantId)
                .stream()
                .map(candidateMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lista candidatos paginados
     */
    @Transactional(readOnly = true)
    public Page<TalentCandidateResponse> findAllCandidates(Pageable pageable) {
        UUID tenantId = getTenantId();
        return candidateRepository.findByTenantIdAndIsActiveTrue(tenantId, pageable)
                .map(candidateMapper::toResponse);
    }

    /**
     * Lista candidatos por vaga
     */
    @Transactional(readOnly = true)
    public List<TalentCandidateResponse> findCandidatesByVacancy(UUID vacancyId) {
        return candidateRepository.findByVacancyIdAndIsActiveTrueOrderByAppliedAtDesc(vacancyId)
                .stream()
                .map(candidateMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lista candidatos por status
     */
    @Transactional(readOnly = true)
    public List<TalentCandidateResponse> findCandidatesByStatus(CandidateStatus status) {
        UUID tenantId = getTenantId();
        return candidateRepository.findByTenantIdAndStatusAndIsActiveTrueOrderByAppliedAtDesc(tenantId, status)
                .stream()
                .map(candidateMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Busca candidato por ID
     */
    @Transactional(readOnly = true)
    public TalentCandidateResponse findCandidateById(UUID id) {
        UUID tenantId = getTenantId();
        TalentCandidate candidate = candidateRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado: " + id));
        return candidateMapper.toResponse(candidate);
    }

    /**
     * Candidatura pública (formulário externo)
     */
    public TalentCandidateResponse applyToVacancy(String publicCode, PublicCandidateApplicationRequest request, MultipartFile resumeFile) {
        JobVacancy vacancy = vacancyRepository.findByPublicCodeAndStatus(publicCode, VacancyStatus.OPEN)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada ou não está aberta: " + publicCode));

        // Verifica deadline
        if (vacancy.getDeadline() != null && vacancy.getDeadline().isBefore(LocalDate.now())) {
            throw new InvalidOperationException("O prazo para candidatura a esta vaga já expirou");
        }

        // Verifica se já existe candidatura com este email
        String email = request.getEmail().toLowerCase().trim();
        if (candidateRepository.existsByEmailAndVacancyId(email, vacancy.getId())) {
            throw new DuplicateResourceException("Já existe uma candidatura com este email para esta vaga");
        }

        // Verifica limite de candidatos
        if (vacancy.getMaxCandidates() != null && vacancy.getMaxCandidates() > 0) {
            long currentCount = candidateRepository.countByVacancyIdAndIsActiveTrue(vacancy.getId());
            if (currentCount >= vacancy.getMaxCandidates()) {
                throw new InvalidOperationException("Esta vaga atingiu o limite máximo de candidatos");
            }
        }

        TalentCandidate candidate = candidateMapper.toEntity(request, vacancy);
        candidate.setTenantId(vacancy.getTenantId());

        // Processa currículo se fornecido
        if (resumeFile != null && !resumeFile.isEmpty()) {
            processResume(candidate, resumeFile, vacancy.getRequirements());
        }

        candidate = candidateRepository.save(candidate);
        log.info("Nova candidatura: {} para vaga {}", candidate.getId(), publicCode);

        return candidateMapper.toResponse(candidate);
    }

    /**
     * Adiciona candidato manualmente (admin)
     */
    public TalentCandidateResponse addCandidate(UUID vacancyId, TalentCandidateRequest request, MultipartFile resumeFile) {
        UUID tenantId = getTenantId();

        JobVacancy vacancy = vacancyRepository.findByTenantIdAndId(tenantId, vacancyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada: " + vacancyId));

        // Verifica se já existe candidatura com este email
        String email = request.getEmail().toLowerCase().trim();
        if (candidateRepository.existsByEmailAndVacancyId(email, vacancyId)) {
            throw new DuplicateResourceException("Já existe uma candidatura com este email para esta vaga");
        }

        TalentCandidate candidate = candidateMapper.toEntity(request, vacancy);
        candidate.setTenantId(tenantId);

        // Processa currículo se fornecido
        if (resumeFile != null && !resumeFile.isEmpty()) {
            processResume(candidate, resumeFile, vacancy.getRequirements());
        }

        candidate = candidateRepository.save(candidate);
        log.info("Candidato adicionado: {} para vaga {}", candidate.getId(), vacancyId);

        return candidateMapper.toResponse(candidate);
    }

    /**
     * Atualiza candidato
     */
    public TalentCandidateResponse updateCandidate(UUID id, TalentCandidateRequest request) {
        UUID tenantId = getTenantId();

        TalentCandidate candidate = candidateRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado: " + id));

        // Verifica se o email mudou e se já existe
        String newEmail = request.getEmail().toLowerCase().trim();
        if (!candidate.getEmail().equals(newEmail)) {
            if (candidateRepository.existsByEmailAndVacancyId(newEmail, candidate.getVacancy().getId())) {
                throw new DuplicateResourceException("Já existe uma candidatura com este email para esta vaga");
            }
        }

        candidateMapper.updateEntity(candidate, request);
        candidate = candidateRepository.save(candidate);
        log.info("Candidato atualizado: {}", id);

        return candidateMapper.toResponse(candidate);
    }

    /**
     * Atualiza status do candidato
     */
    public TalentCandidateResponse updateCandidateStatus(UUID id, CandidateStatusUpdateRequest request, UUID userId) {
        UUID tenantId = getTenantId();

        TalentCandidate candidate = candidateRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado: " + id));

        candidate.updateStatus(request.getStatus(), request.getNotes(), userId);

        if (request.getRating() != null) {
            candidate.setRating(request.getRating());
        }

        candidate = candidateRepository.save(candidate);
        log.info("Status do candidato {} atualizado para: {}", id, request.getStatus());

        return candidateMapper.toResponse(candidate);
    }

    /**
     * Upload de currículo para candidato existente
     */
    public TalentCandidateResponse uploadResume(UUID id, MultipartFile resumeFile) {
        UUID tenantId = getTenantId();

        TalentCandidate candidate = candidateRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado: " + id));

        processResume(candidate, resumeFile, candidate.getVacancy().getRequirements());

        candidate = candidateRepository.save(candidate);
        log.info("Currículo atualizado para candidato: {}", id);

        return candidateMapper.toResponse(candidate);
    }

    /**
     * Exclui candidato (soft delete)
     */
    public void deleteCandidate(UUID id) {
        UUID tenantId = getTenantId();

        TalentCandidate candidate = candidateRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado: " + id));

        candidate.setIsActive(false);
        candidateRepository.save(candidate);
        log.info("Candidato excluído: {}", id);
    }

    // ==================== ESTATÍSTICAS ====================

    /**
     * Retorna estatísticas do banco de talentos
     */
    @Transactional(readOnly = true)
    public TalentPoolStatsResponse getStats() {
        UUID tenantId = getTenantId();

        // Estatísticas de vagas
        long totalVacancies = vacancyRepository.countByTenantIdAndIsActiveTrue(tenantId);
        long openVacancies = vacancyRepository.countByTenantIdAndStatusAndIsActiveTrue(tenantId, VacancyStatus.OPEN);
        long draftVacancies = vacancyRepository.countByTenantIdAndStatusAndIsActiveTrue(tenantId, VacancyStatus.DRAFT);
        long closedVacancies = vacancyRepository.countByTenantIdAndStatusAndIsActiveTrue(tenantId, VacancyStatus.CLOSED);

        // Estatísticas de candidatos
        long totalCandidates = candidateRepository.countByTenantIdAndIsActiveTrue(tenantId);
        long newCandidates = candidateRepository.countByTenantIdAndStatusAndIsActiveTrue(tenantId, CandidateStatus.NEW);
        long inProcessCandidates = candidateRepository.countByTenantIdAndStatusAndIsActiveTrue(tenantId, CandidateStatus.SCREENING)
                + candidateRepository.countByTenantIdAndStatusAndIsActiveTrue(tenantId, CandidateStatus.INTERVIEW);
        long approvedCandidates = candidateRepository.countByTenantIdAndStatusAndIsActiveTrue(tenantId, CandidateStatus.APPROVED);
        long hiredCandidates = candidateRepository.countByTenantIdAndStatusAndIsActiveTrue(tenantId, CandidateStatus.HIRED);

        // Distribuição por status
        Map<String, Long> candidatesByStatus = new HashMap<>();
        candidateRepository.countByStatusGrouped(tenantId).forEach(row -> {
            candidatesByStatus.put(row[0].toString(), (Long) row[1]);
        });

        // Distribuição por vaga
        Map<String, Long> candidatesByVacancy = new HashMap<>();
        candidateRepository.countByVacancyGrouped(tenantId).forEach(row -> {
            candidatesByVacancy.put((String) row[0], (Long) row[1]);
        });

        return TalentPoolStatsResponse.builder()
                .totalVacancies(totalVacancies)
                .openVacancies(openVacancies)
                .draftVacancies(draftVacancies)
                .closedVacancies(closedVacancies)
                .totalCandidates(totalCandidates)
                .newCandidates(newCandidates)
                .inProcessCandidates(inProcessCandidates)
                .approvedCandidates(approvedCandidates)
                .hiredCandidates(hiredCandidates)
                .candidatesByStatus(candidatesByStatus)
                .candidatesByVacancy(candidatesByVacancy)
                .build();
    }

    // ==================== MÉTODOS AUXILIARES ====================

    private UUID getTenantId() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null) {
            throw new IllegalStateException("Tenant não definido no contexto");
        }
        return UUID.fromString(tenant);
    }

    private JobVacancyResponse toResponseWithCandidateCount(JobVacancy vacancy) {
        JobVacancyResponse response = vacancyMapper.toResponse(vacancy);
        log.debug("Contando candidatos para vaga: {}", vacancy.getId());
        long count = candidateRepository.countByVacancyIdAndIsActiveTrue(vacancy.getId());
        response.setCandidateCount((int) count);
        return response;
    }

    private void processResume(TalentCandidate candidate, MultipartFile file, String vacancyRequirements) {
        try {
            // Valida tipo de arquivo
            String contentType = file.getContentType();
            String originalFilename = file.getOriginalFilename();

            if (contentType == null || originalFilename == null) {
                throw new InvalidOperationException("Arquivo inválido");
            }

            boolean isPdf = contentType.equals("application/pdf") || originalFilename.toLowerCase().endsWith(".pdf");
            boolean isWord = contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                    || contentType.equals("application/msword")
                    || originalFilename.toLowerCase().endsWith(".docx")
                    || originalFilename.toLowerCase().endsWith(".doc");

            if (!isPdf && !isWord) {
                throw new InvalidOperationException("Apenas arquivos PDF ou Word são aceitos");
            }

            // Salva arquivo
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFileName = UUID.randomUUID() + fileExtension;
            Path uploadPath = Paths.get(UPLOAD_DIR);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            candidate.setResumeFileName(originalFilename);
            candidate.setResumeFilePath(filePath.toString());
            candidate.setResumeFileType(isPdf ? "PDF" : "WORD");

            // Extrai texto do currículo
            String resumeText = extractTextFromFile(file, isPdf);

            // Tenta análise via IA
            try {
                ResumeAnalysisRequest analysisRequest = ResumeAnalysisRequest.builder()
                        .resumeText(resumeText)
                        .fileName(originalFilename)
                        .fileType(isPdf ? "PDF" : "WORD")
                        .vacancyRequirements(vacancyRequirements)
                        .build();

                ResumeAnalysisResponse analysis = resumeAnalysisClient.analyzeResume(analysisRequest);

                if (analysis != null) {
                    // Preenche campos extraídos
                    if (analysis.getSkills() != null && !analysis.getSkills().isEmpty()) {
                        candidate.setSkills(String.join(", ", analysis.getSkills()));
                    }

                    if (analysis.getEducation() != null && !analysis.getEducation().isEmpty()) {
                        StringBuilder edu = new StringBuilder();
                        for (ResumeAnalysisResponse.EducationEntry entry : analysis.getEducation()) {
                            if (edu.length() > 0) edu.append("; ");
                            edu.append(entry.getDegree()).append(" em ").append(entry.getField())
                                    .append(" - ").append(entry.getInstitution());
                        }
                        candidate.setEducation(edu.toString());
                    }

                    if (analysis.getExperiences() != null && !analysis.getExperiences().isEmpty()) {
                        StringBuilder exp = new StringBuilder();
                        for (ResumeAnalysisResponse.ExperienceEntry entry : analysis.getExperiences()) {
                            if (exp.length() > 0) exp.append("; ");
                            exp.append(entry.getPosition()).append(" na ").append(entry.getCompany());
                        }
                        candidate.setExperienceSummary(exp.toString());
                    }

                    if (analysis.getCertifications() != null && !analysis.getCertifications().isEmpty()) {
                        candidate.setCertifications(String.join(", ", analysis.getCertifications()));
                    }

                    if (analysis.getLanguages() != null && !analysis.getLanguages().isEmpty()) {
                        StringBuilder langs = new StringBuilder();
                        for (ResumeAnalysisResponse.LanguageEntry entry : analysis.getLanguages()) {
                            if (langs.length() > 0) langs.append(", ");
                            langs.append(entry.getLanguage()).append(" (").append(entry.getLevel()).append(")");
                        }
                        candidate.setLanguages(langs.toString());
                    }

                    // Armazena dados brutos
                    Map<String, Object> parsedData = new HashMap<>();
                    parsedData.put("profileSummary", analysis.getProfileSummary());
                    parsedData.put("compatibilityScore", analysis.getCompatibilityScore());
                    parsedData.put("strengths", analysis.getStrengths());
                    parsedData.put("concerns", analysis.getConcerns());
                    parsedData.put("rawData", analysis.getRawData());
                    candidate.setResumeParsedData(parsedData);

                    log.info("Currículo analisado com sucesso via IA para candidato");
                }
            } catch (Exception e) {
                log.warn("Falha na análise do currículo via IA, usando extração básica: {}", e.getMessage());
                // Fallback: armazena texto extraído
                Map<String, Object> parsedData = new HashMap<>();
                parsedData.put("rawText", resumeText.substring(0, Math.min(5000, resumeText.length())));
                candidate.setResumeParsedData(parsedData);
            }

        } catch (IOException e) {
            log.error("Erro ao processar currículo", e);
            throw new InvalidOperationException("Erro ao processar o currículo: " + e.getMessage());
        }
    }

    private String extractTextFromFile(MultipartFile file, boolean isPdf) throws IOException {
        if (isPdf) {
            return extractTextFromPdf(file.getInputStream());
        } else {
            return extractTextFromWord(file.getInputStream());
        }
    }

    private String extractTextFromPdf(InputStream inputStream) throws IOException {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractTextFromWord(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            StringBuilder text = new StringBuilder();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                text.append(paragraph.getText()).append("\n");
            }
            return text.toString();
        }
    }
}
