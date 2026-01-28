package com.axonrh.core.setup.service;

import com.axonrh.core.setup.entity.CompanyProfile;
import com.axonrh.core.setup.entity.SetupProgress;
import com.axonrh.core.setup.entity.SetupProgress.SetupStatus;
import com.axonrh.core.setup.repository.CompanyProfileRepository;
import com.axonrh.core.setup.repository.SetupProgressRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class SetupWizardService {

    private static final Logger log = LoggerFactory.getLogger(SetupWizardService.class);

    private final SetupProgressRepository progressRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final com.axonrh.core.setup.repository.DepartmentRepository departmentRepository;
    private final com.axonrh.core.setup.repository.PositionRepository positionRepository;
    private final com.axonrh.core.setup.repository.TenantRepository tenantRepository;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    public SetupWizardService(SetupProgressRepository progressRepository,
                              CompanyProfileRepository companyProfileRepository,
                              com.axonrh.core.setup.repository.DepartmentRepository departmentRepository,
                              com.axonrh.core.setup.repository.PositionRepository positionRepository,
                              com.axonrh.core.setup.repository.TenantRepository tenantRepository) {
        this.progressRepository = progressRepository;
        this.companyProfileRepository = companyProfileRepository;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.tenantRepository = tenantRepository;
    }

    /**
     * Inicia ou retorna progresso do wizard.
     */
    public SetupProgress getOrCreateProgress(UUID tenantId, UUID userId) {
        if (tenantId != null) {
            return progressRepository.findByTenantId(tenantId)
                    .orElseGet(() -> createNewProgress(tenantId, userId));
        }

        return progressRepository.findByCreatedBy(userId)
                .orElseGet(() -> createNewProgress(UUID.randomUUID(), userId));
    }

    private SetupProgress createNewProgress(UUID tenantId, UUID userId) {
        // Ensure tenant exists before creating progress in case it was missed
        ensureTenantExists(tenantId, "Draft Tenant", null);

        SetupProgress progress = new SetupProgress();
        progress.setTenantId(tenantId);
        progress.setCreatedBy(userId);
        return progressRepository.save(progress);
    }

    /**
     * Salva dados de uma etapa.
     */
    /**
     * Salva dados de uma etapa.
     */
    public SetupProgress saveStepData(UUID tenantId, UUID userId, int step, Map<String, Object> data) {
        UUID effectiveTenantId = resolveTenantId(tenantId, userId);
        SetupProgress progress = progressRepository.findByTenantId(effectiveTenantId)
                .orElseThrow(() -> new IllegalStateException("Setup não iniciado"));

        try {
            log.info("Salvando dados da etapa {} do setup para tenant {}", step, effectiveTenantId);
            progress.setStepData(step, data);
            progress.setLastActivityAt(LocalDateTime.now());

            return progressRepository.save(progress);
        } catch (Exception e) {
            log.error("Falha ao salvar dados da etapa {} do setup para tenant {}", step, effectiveTenantId, e);
            throw new RuntimeException("Erro ao salvar dados da etapa: " + e.getMessage(), e);
        }
    }

    /**
     * Completa uma etapa.
     */
    /**
     * Completa uma etapa.
     */
    public SetupProgress completeStep(UUID tenantId, UUID userId, int step, Map<String, Object> data) {
        UUID effectiveTenantId = resolveTenantId(tenantId, userId);
        SetupProgress progress = progressRepository.findByTenantId(effectiveTenantId)
                .orElseThrow(() -> new IllegalStateException("Setup não iniciado"));

        // Validate required steps before completing
        if (!canCompleteStep(progress, step)) {
            throw new IllegalStateException("Etapas anteriores obrigatórias não foram completadas");
        }

        try {
            log.info("Completando etapa {} do setup para tenant {}", step, effectiveTenantId);
            if (data != null && !data.isEmpty()) {
                progress.setStepData(step, data);
            }

            progress.setStepCompleted(step, true);

            // Auto-advance current step
            if (step == progress.getCurrentStep() && step < progress.getTotalSteps()) {
                progress.setCurrentStep(step + 1);
            }

            // Process step-specific logic
            processStepCompletion(effectiveTenantId, step, data);

            progress.setLastActivityAt(LocalDateTime.now());

            return progressRepository.save(progress);
        } catch (Exception e) {
            log.error("Falha ao completar etapa {} do setup para tenant {}", step, effectiveTenantId, e);
            throw new RuntimeException("Erro ao completar etapa: " + e.getMessage(), e);
        }
    }

    /**
     * Navega para uma etapa especifica.
     */
    /**
     * Navega para uma etapa especifica.
     */
    public SetupProgress goToStep(UUID tenantId, UUID userId, int step) {
        UUID effectiveTenantId = resolveTenantId(tenantId, userId);
        SetupProgress progress = progressRepository.findByTenantId(effectiveTenantId)
                .orElseThrow(() -> new IllegalStateException("Setup não iniciado"));

        if (step < 1 || step > progress.getTotalSteps()) {
            throw new IllegalArgumentException("Etapa inválida");
        }

        // Can only go to completed steps or the next available step
        int maxAllowedStep = getMaxAllowedStep(progress);
        if (step > maxAllowedStep) {
            throw new IllegalStateException("Complete as etapas anteriores primeiro");
        }

        progress.setCurrentStep(step);
        progress.setLastActivityAt(LocalDateTime.now());

        return progressRepository.save(progress);
    }

    /**
     * Finaliza o wizard.
     */
    /**
     * Finaliza o wizard.
     */
    public SetupProgress finishSetup(UUID tenantId, UUID userId) {
        UUID effectiveTenantId = resolveTenantId(tenantId, userId);
        SetupProgress progress = progressRepository.findByTenantId(effectiveTenantId)
                .orElseThrow(() -> new IllegalStateException("Setup não iniciado"));

        // Validate all required steps
        List<String> missingSteps = validateRequiredSteps(progress);
        if (!missingSteps.isEmpty()) {
            throw new IllegalStateException("Etapas obrigatórias não completadas: " + String.join(", ", missingSteps));
        }

        progress.setStep9Review(true);
        progress.setStatus(SetupStatus.COMPLETED);
        progress.setCompletedAt(LocalDateTime.now());

        return progressRepository.save(progress);
    }

    /**
     * Obtem resumo do progresso.
     */
    public SetupSummary getSummary(UUID tenantId, UUID userId) {
        SetupProgress progress = getOrCreateProgress(tenantId, userId);

        List<StepInfo> steps = new ArrayList<>();
        steps.add(new StepInfo(1, "Dados da Empresa", progress.isStep1CompanyData(), isStepRequired(1)));
        steps.add(new StepInfo(2, "Estrutura Organizacional", progress.isStep2OrgStructure(), isStepRequired(2)));
        steps.add(new StepInfo(3, "Regras Trabalhistas", progress.isStep3LaborRules(), isStepRequired(3)));
        steps.add(new StepInfo(4, "Identidade Visual", progress.isStep4Branding(), isStepRequired(4)));
        steps.add(new StepInfo(5, "Módulos", progress.isStep5Modules(), isStepRequired(5)));
        steps.add(new StepInfo(6, "Usuários", progress.isStep6Users(), isStepRequired(6)));
        steps.add(new StepInfo(7, "Integrações", progress.isStep7Integrations(), isStepRequired(7)));
        steps.add(new StepInfo(8, "Importação de Dados", progress.isStep8DataImport(), isStepRequired(8)));
        steps.add(new StepInfo(9, "Revisão e Ativação", progress.isStep9Review(), isStepRequired(9)));

        return new SetupSummary(
                progress.getCurrentStep(),
                progress.getTotalSteps(),
                progress.getCompletedStepsCount(),
                progress.getProgressPercentage(),
                progress.getStatus().name(),
                steps,
                progress.getStartedAt(),
                progress.getCompletedAt()
        );
    }

    /**
     * Recupera dados de uma etapa.
     */
    /**
     * Recupera dados de uma etapa.
     */
    public Map<String, Object> getStepData(UUID tenantId, UUID userId, int step) {
        SetupProgress progress = getOrCreateProgress(tenantId, userId);

        return progress.getStepData(step);
    }

    private UUID resolveTenantId(UUID tenantId, UUID userId) {
        if (tenantId != null) {
            return tenantId;
        }
        return progressRepository.findByCreatedBy(userId)
                .map(SetupProgress::getTenantId)
                .orElseGet(() -> {
                    // Fallback para getOrCreateProgress se não encontrar por userId
                    log.info("TenantID não resolvido por userId, criando novo progresso...");
                    return getOrCreateProgress(null, userId).getTenantId();
                });
    }

    // Step 1: Save company data
    public CompanyProfile saveCompanyProfile(UUID tenantId, CompanyProfile profile) {
        try {
            if (tenantId == null) {
                // Primeira etapa do setup: gerar novo Tenant ID
                if (profile.getTenantId() == null) {
                    profile.setTenantId(UUID.randomUUID());
                }
                tenantId = profile.getTenantId();
                log.info("Gerado novo Tenant ID: {}", tenantId);
            } else {
                profile.setTenantId(tenantId);
            }
            
            log.info("Salvando perfil da empresa do setup para tenant {}", tenantId);
            
            // Lógica de Upsert para evitar erro de chave duplicada
            Optional<CompanyProfile> existing = companyProfileRepository.findByTenantId(tenantId);
            if (existing.isPresent()) {
                CompanyProfile toUpdate = existing.get();
                updateProfileFields(toUpdate, profile);
                return companyProfileRepository.save(toUpdate);
            }
            
            return companyProfileRepository.save(profile);
        } catch (Exception e) {
            log.error("Falha ao salvar perfil da empresa do setup para tenant {}", tenantId, e);
            throw e;
        }
    }

    private void updateProfileFields(CompanyProfile target, CompanyProfile source) {
        target.setLegalName(source.getLegalName());
        target.setTradeName(source.getTradeName());
        target.setCnpj(source.getCnpj());
        target.setEmail(source.getEmail());
        target.setPhone(source.getPhone());
        target.setWebsite(source.getWebsite());
        target.setAddressStreet(source.getAddressStreet());
        target.setAddressNumber(source.getAddressNumber());
        target.setAddressComplement(source.getAddressComplement());
        target.setAddressNeighborhood(source.getAddressNeighborhood());
        target.setAddressCity(source.getAddressCity());
        target.setAddressState(source.getAddressState());
        target.setAddressZipCode(source.getAddressZipCode());
        target.setAddressCountry(source.getAddressCountry());
        target.setCompanySize(source.getCompanySize());
        target.setIndustry(source.getIndustry());
        target.setCnaeCode(source.getCnaeCode());
        target.setFoundingDate(source.getFoundingDate());
        target.setEmployeeCount(source.getEmployeeCount());
        target.setTaxRegime(source.getTaxRegime());
        target.setLegalRepresentativeName(source.getLegalRepresentativeName());
        target.setLegalRepresentativeCpf(source.getLegalRepresentativeCpf());
        target.setLegalRepresentativeRole(source.getLegalRepresentativeRole());
        target.setAccountantName(source.getAccountantName());
        target.setAccountantCrc(source.getAccountantCrc());
        target.setAccountantEmail(source.getAccountantEmail());
        target.setAccountantPhone(source.getAccountantPhone());
    }

    public Optional<CompanyProfile> getCompanyProfile(UUID tenantId, UUID userId) {
        if (tenantId != null) {
            return companyProfileRepository.findByTenantId(tenantId);
        }
        return progressRepository.findByCreatedBy(userId)
                .flatMap(progress -> companyProfileRepository.findByTenantId(progress.getTenantId()));
    }

    /**
     * Inicializa o setup da empresa (Admin passo 1)
     */
    public UUID initCompanySetup(com.axonrh.core.setup.dto.SetupInitRequest request) {
        // Check if CNPJ already exists
        List<CompanyProfile> existing = companyProfileRepository.findAllByCnpj(request.getCnpj());
        if (!existing.isEmpty()) {
            UUID existingTenantId = existing.get(0).getTenantId();
            log.info("Setup já existente para CNPJ {}. Retornando TenantID existente: {}", request.getCnpj(), existingTenantId);
            
            // GARANTIR que o progresso existe, senão dá IllegalStateException: Setup não iniciado
            if (progressRepository.findByTenantId(existingTenantId).isEmpty()) {
                log.info("Criando progresso faltante para tenant existente {}", existingTenantId);
                SetupProgress progress = new SetupProgress();
                progress.setTenantId(existingTenantId);
                progressRepository.save(progress);
            }
            
            return existingTenantId;
        }

        UUID tenantId = UUID.randomUUID();
        log.info("Iniciando setup para nova empresa. TenantID gerado: {}", tenantId);

        // 0. Criar Tenant
        ensureTenantExists(tenantId, request.getCorporateName(), request.getCnpj());

        // 1. Criar perfil inicial
        CompanyProfile profile = new CompanyProfile();
        profile.setTenantId(tenantId);
        profile.setLegalName(request.getCorporateName());
        profile.setCnpj(request.getCnpj());
        profile.setEmail(request.getEmail()); 
        
        companyProfileRepository.save(profile);

        // 2. Criar progresso inicial
        SetupProgress progress = new SetupProgress();
        progress.setTenantId(tenantId);
        progress.setStep1CompanyData(false);
        progressRepository.save(progress);

        return tenantId;
    }

    private void ensureTenantExists(UUID tenantId, String name, String cnpj) {
        if (!tenantRepository.existsById(tenantId)) {
            log.info("Criando registro na tabela tenants para ID {}", tenantId);
            com.axonrh.core.setup.entity.Tenant tenant = new com.axonrh.core.setup.entity.Tenant();
            tenant.setId(tenantId);
            tenant.setName(name);
            tenant.setCnpj(cnpj);
            
            // Gerar subdomain e schema_name obrigatórios
            String base = name.toLowerCase().replaceAll("[^a-z0-9]", "");
            if (base.isEmpty()) base = "tenant" + tenantId.toString().substring(0, 8);
            tenant.setSubdomain(base + "-" + tenantId.toString().substring(0, 4));
            tenant.setSchemaName("tenant_" + tenantId.toString().replace("-", "_"));
            tenant.setStatus("ACTIVE");
            
            tenantRepository.save(tenant);
        }
    }

    // Org Structure Management
    public List<com.axonrh.core.setup.entity.Department> getDepartments(UUID tenantId) {
        return departmentRepository.findAllByTenantId(tenantId);
    }

    public com.axonrh.core.setup.entity.Department saveDepartment(UUID tenantId, com.axonrh.core.setup.entity.Department department) {
        department.setTenantId(tenantId);
        
        // Lógica de Upsert por Code
        Optional<com.axonrh.core.setup.entity.Department> existing = 
                departmentRepository.findByTenantIdAndCode(tenantId, department.getCode());
        
        if (existing.isPresent()) {
            com.axonrh.core.setup.entity.Department toUpdate = existing.get();
            toUpdate.setName(department.getName());
            toUpdate.setDescription(department.getDescription());
            toUpdate.setParent(department.getParent());
            toUpdate.setManagerId(department.getManagerId());
            toUpdate.setIsActive(department.getIsActive());
            return departmentRepository.save(toUpdate);
        }
        
        return departmentRepository.save(department);
    }

    public void deleteDepartment(UUID tenantId, UUID id) {
        departmentRepository.findById(id).ifPresent(d -> {
            if (d.getTenantId().equals(tenantId)) {
                departmentRepository.delete(d);
            }
        });
    }

    public List<com.axonrh.core.setup.entity.Position> getPositions(UUID tenantId) {
        return positionRepository.findAllByTenantIdWithDepartment(tenantId);
    }

    public com.axonrh.core.setup.entity.Position savePosition(UUID tenantId, com.axonrh.core.setup.entity.Position position) {
        position.setTenantId(tenantId);
        
        // Lógica de Upsert por Code
        Optional<com.axonrh.core.setup.entity.Position> existing = 
                positionRepository.findByTenantIdAndCode(tenantId, position.getCode());
        
        if (existing.isPresent()) {
            com.axonrh.core.setup.entity.Position toUpdate = existing.get();
            toUpdate.setTitle(position.getTitle());
            toUpdate.setDescription(position.getDescription());
            toUpdate.setCboCode(position.getCboCode());
            toUpdate.setSalaryRangeMin(position.getSalaryRangeMin());
            toUpdate.setSalaryRangeMax(position.getSalaryRangeMax());
            toUpdate.setLevel(position.getLevel());
            toUpdate.setDepartment(position.getDepartment());
            toUpdate.setIsActive(position.getIsActive());
            return positionRepository.save(toUpdate);
        }
        
        return positionRepository.save(position);
    }

    public void deletePosition(UUID tenantId, UUID id) {
        positionRepository.findById(id).ifPresent(p -> {
            if (p.getTenantId().equals(tenantId)) {
                positionRepository.delete(p);
            }
        });
    }

    // Private helper methods

    private boolean canCompleteStep(SetupProgress progress, int step) {
        // Step 1 can always be completed
        if (step == 1) return true;

        // Required steps must be completed in order
        List<Integer> requiredSteps = List.of(1, 2, 3, 5, 6); // Required steps before this
        for (int reqStep : requiredSteps) {
            if (reqStep < step && isStepRequired(reqStep) && !progress.isStepCompleted(reqStep)) {
                return false;
            }
        }

        return true;
    }

    private int getMaxAllowedStep(SetupProgress progress) {
        // Find the first incomplete required step
        int[] requiredOrder = {1, 2, 3, 5, 6, 9};
        for (int step : requiredOrder) {
            if (!progress.isStepCompleted(step)) {
                return step;
            }
        }
        return progress.getTotalSteps();
    }

    private boolean isStepRequired(int step) {
        // Required steps: 1, 2, 3, 5, 6, 9
        // Optional steps: 4, 7, 8
        return switch (step) {
            case 1, 2, 3, 5, 6, 9 -> true;
            default -> false;
        };
    }

    private List<String> validateRequiredSteps(SetupProgress progress) {
        List<String> missing = new ArrayList<>();

        if (!progress.isStep1CompanyData()) missing.add("Dados da Empresa");
        if (!progress.isStep2OrgStructure()) missing.add("Estrutura Organizacional");
        if (!progress.isStep3LaborRules()) missing.add("Regras Trabalhistas");
        if (!progress.isStep5Modules()) missing.add("Módulos");
        if (!progress.isStep6Users()) missing.add("Usuários");

        return missing;
    }

    private void processStepCompletion(UUID tenantId, int step, Map<String, Object> data) {
        switch (step) {
            case 1 -> processCompanyData(tenantId, data);
            case 2 -> processOrgStructure(tenantId, data);
            case 3 -> processLaborRules(tenantId, data);
            case 4 -> processBranding(tenantId, data);
            case 5 -> processModules(tenantId, data);
            case 6 -> processUsers(tenantId, data);
            case 7 -> processIntegrations(tenantId, data);
            case 8 -> processDataImport(tenantId, data);
        }
    }

    private void processCompanyData(UUID tenantId, Map<String, Object> data) {
        // Create or update company profile
        log.info("Processing company data for tenant: {}", tenantId);
    }

    private void processOrgStructure(UUID tenantId, Map<String, Object> data) {
        // Create departments and positions
        log.info("Processing org structure for tenant: {}", tenantId);
    }

    private void processLaborRules(UUID tenantId, Map<String, Object> data) {
        // Save labor rules configuration
        log.info("Processing labor rules for tenant: {}", tenantId);
    }

    private void processBranding(UUID tenantId, Map<String, Object> data) {
        // Save branding configuration
        log.info("Processing branding for tenant: {}", tenantId);
    }

    private void processModules(UUID tenantId, Map<String, Object> data) {
        // Enable/disable modules
        log.info("Processing modules for tenant: {}", tenantId);
    }

    private void processUsers(UUID tenantId, Map<String, Object> data) {
        // Create initial users
        log.info("Processing users for tenant: {}", tenantId);
    }

    private void processIntegrations(UUID tenantId, Map<String, Object> data) {
        // Configure integrations
        log.info("Processing integrations for tenant: {}", tenantId);
    }

    private void processDataImport(UUID tenantId, Map<String, Object> data) {
        // Process data imports
        log.info("Processing data import for tenant: {}", tenantId);
    }

    // DTOs
    public record SetupSummary(
            int currentStep,
            int totalSteps,
            int completedSteps,
            double progressPercentage,
            String status,
            List<StepInfo> steps,
            LocalDateTime startedAt,
            LocalDateTime completedAt
    ) {}

    public record StepInfo(
            int number,
            String name,
            boolean completed,
            boolean required
    ) {}
}
