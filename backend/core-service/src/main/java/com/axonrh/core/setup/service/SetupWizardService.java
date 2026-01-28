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
import org.springframework.security.crypto.password.PasswordEncoder;
import com.axonrh.core.setup.repository.UserRepository;
import com.axonrh.core.setup.repository.RoleRepository;
import com.axonrh.core.setup.entity.auth.User;
import com.axonrh.core.setup.entity.auth.Role;

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
    private final com.axonrh.core.setup.repository.TenantBrandingRepository brandingRepository;
    private final com.axonrh.core.setup.repository.TenantIntegrationRepository integrationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    public SetupWizardService(SetupProgressRepository progressRepository,
                              CompanyProfileRepository companyProfileRepository,
                              com.axonrh.core.setup.repository.DepartmentRepository departmentRepository,
                              com.axonrh.core.setup.repository.PositionRepository positionRepository,
                              com.axonrh.core.setup.repository.TenantRepository tenantRepository,
                              com.axonrh.core.setup.repository.TenantBrandingRepository brandingRepository,
                              com.axonrh.core.setup.repository.TenantIntegrationRepository integrationRepository,
                              UserRepository userRepository,
                              RoleRepository roleRepository,
                              PasswordEncoder passwordEncoder) {
        this.progressRepository = progressRepository;
        this.companyProfileRepository = companyProfileRepository;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.tenantRepository = tenantRepository;
        this.brandingRepository = brandingRepository;
        this.integrationRepository = integrationRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
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
    @Transactional
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
        Map<String, Object> finalData = (data != null && !data.isEmpty()) ? data : progress.getStepData(step);
        processStepCompletion(effectiveTenantId, step, finalData);

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
        progress.setStatus(SetupStatus.ACTIVATED);
        progress.setCompletedAt(LocalDateTime.now());

        // Ativação final: Transfere dados de rascunho para tabelas operacionais
        processActivation(progress);

        return progressRepository.save(progress);
    }

    private void processActivation(SetupProgress progress) {
        log.info("Iniciando ativação final para tenant: {}", progress.getTenantId());
        
        // Ativar Branding
        processBranding(progress.getTenantId(), progress.getStepData(4));
        
        // Ativar Usuários
        processUsers(progress.getTenantId(), progress.getStepData(6));
        
        // Ativar Importação de Colaboradores
        processDataImport(progress.getTenantId(), progress.getStepData(8));
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
        Map<String, Object> data = progress.getStepData(step);

        // Fallback especial para Branding se os dados estiverem vazios no progresso
        if (step == 4 && data.isEmpty()) {
            UUID effectiveTenantId = progress.getTenantId();
            return brandingRepository.findByTenantId(effectiveTenantId)
                    .map(b -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("logoUrl", b.getLogoUrl());
                        map.put("logoWidth", b.getLogoWidth());
                        map.put("primaryColor", b.getPrimaryColor());
                        map.put("secondaryColor", b.getSecondaryColor());
                        map.put("accentColor", b.getAccentColor());
                        map.put("fontFamily", b.getFontFamily());
                        map.put("baseFontSize", b.getBaseFontSize());
                        return map;
                    })
                    .orElse(data);
        }

        // Fallback para Integrações (Step 7)
        if (step == 7 && data.isEmpty()) {
            UUID effectiveTenantId = progress.getTenantId();
            return integrationRepository.findByTenantId(effectiveTenantId)
                    .map(i -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("esocialEnabled", i.getEsocialEnabled());
                        map.put("esocialEnvironment", i.getEsocialEnvironment());
                        map.put("esocialCertificateId", i.getEsocialCertificateId());
                        map.put("accountingSoftware", i.getAccountingSoftware());
                        map.put("accountingApiKey", i.getAccountingApiKey());
                        map.put("accountingApiUrl", i.getAccountingApiUrl());
                        map.put("erpSystem", i.getErpSystem());
                        map.put("erpApiUrl", i.getErpApiUrl());
                        map.put("erpAuthToken", i.getErpAuthToken());
                        map.put("benefitsProvider", i.getBenefitsProvider());
                        map.put("benefitsApiKey", i.getBenefitsApiKey());
                        return map;
                    })
                    .orElse(data);
        }

        return data;
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
        
        // Vincular departamento se departmentId estiver presente e department for null
        if (position.getDepartmentId() != null && position.getDepartment() == null) {
            departmentRepository.findById(position.getDepartmentId()).ifPresent(position::setDepartment);
        }
        
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
        log.info("Processando branding para tenant: {}", tenantId);
        if (data == null || data.isEmpty()) return;

        com.axonrh.core.setup.entity.TenantBranding branding = brandingRepository.findByTenantId(tenantId)
                .orElse(new com.axonrh.core.setup.entity.TenantBranding());
        
        branding.setTenantId(tenantId);
        
        if (data.containsKey("logoUrl")) branding.setLogoUrl((String) data.get("logoUrl"));
        if (data.containsKey("logoWidth")) {
            Object val = data.get("logoWidth");
            branding.setLogoWidth(val instanceof Number n ? n.intValue() : Integer.parseInt(val.toString()));
        }
        if (data.containsKey("primaryColor")) branding.setPrimaryColor((String) data.get("primaryColor"));
        if (data.containsKey("secondaryColor")) branding.setSecondaryColor((String) data.get("secondaryColor"));
        if (data.containsKey("accentColor")) branding.setAccentColor((String) data.get("accentColor"));
        if (data.containsKey("fontFamily")) branding.setFontFamily((String) data.get("fontFamily"));
        if (data.containsKey("baseFontSize")) {
            Object val = data.get("baseFontSize");
            branding.setBaseFontSize(val instanceof Number n ? n.intValue() : Integer.parseInt(val.toString()));
        }

        brandingRepository.save(branding);
    }

    private void processModules(UUID tenantId, Map<String, Object> data) {
        // Enable/disable modules
            log.info("Processing modules for tenant: {}", tenantId);
    }

    private void processUsers(UUID tenantId, Map<String, Object> data) {
        // Create initial users
        log.info("Processando usuários para o tenant: {}. Data keys: {}", tenantId, data != null ? data.keySet() : "null");
        
        if (data == null || !data.containsKey("users")) {
            log.warn("Nenhum dado de usuário fornecido na etapa 6 para tenant {}", tenantId);
            return;
        }

        Object usersObj = data.get("users");
        if (!(usersObj instanceof List<?> usersList)) {
            log.error("Formato inválido para lista de usuários na etapa 6 para tenant {}. Tipo: {}", 
                tenantId, usersObj != null ? usersObj.getClass().getName() : "null");
            return;
        }

        log.info("Encontrados {} usuários para processar no tenant {}", usersList.size(), tenantId);

        // Buscar Role ADMIN pre-definido (UUID fixo da migração V7)
        UUID adminRoleId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> {
                    log.info("Role ADMIN não encontrado por nome, buscando por ID fixo...");
                    return roleRepository.findById(adminRoleId)
                        .orElseThrow(() -> {
                            log.error("Role ADMIN não encontrado nem por nome nem por ID fixo (11111111-1111-1111-1111-111111111111)!");
                            return new RuntimeException("Role ADMIN não encontrado no sistema. Verifique as migrações.");
                        });
                });

        for (Object item : usersList) {
            if (item instanceof Map<?, ?> userMap) {
                String name = (String) userMap.get("name");
                String email = (String) userMap.get("email");
                String password = (String) userMap.get("password");

                log.debug("Processando usuário da lista: email={}, name={}", email, name);

                if (email == null || email.isBlank()) {
                    log.warn("Usuário ignorado devido a email ausente ou em branco");
                    continue;
                }

                if (password == null || password.isBlank()) {
                    log.warn("Usuário {} ignorado devido a senha ausente ou em branco", email);
                    continue;
                }

                if (userRepository.existsByEmail(email)) {
                    log.info("Usuário já existe no sistema: {}. Pulando criação.", email);
                    continue;
                }

                log.info("Salvando novo usuário no tenant {}: {}", tenantId, email);
                User user = User.builder()
                        .tenantId(tenantId)
                        .name(name)
                        .email(email)
                        .passwordHash(passwordEncoder.encode(password))
                        .status("ACTIVE")
                        .roles(Set.of(adminRole))
                        .build();

                userRepository.save(user);
                log.info("Usuário administrador criado com sucesso no banco: {}", email);
            } else {
                log.warn("Item na lista de usuários não é um Map: {}", item != null ? item.getClass().getName() : "null");
            }
        }
    }

    private void processIntegrations(UUID tenantId, Map<String, Object> data) {
        log.info("Processando integrações para o tenant: {}", tenantId);
        if (data == null || data.isEmpty()) return;

        com.axonrh.core.setup.entity.TenantIntegration integration = integrationRepository.findByTenantId(tenantId)
                .orElse(new com.axonrh.core.setup.entity.TenantIntegration());

        integration.setTenantId(tenantId);

        if (data.containsKey("esocialEnabled")) 
            integration.setEsocialEnabled((Boolean) data.get("esocialEnabled"));
        
        if (data.containsKey("esocialEnvironment")) 
            integration.setEsocialEnvironment((String) data.get("esocialEnvironment"));
            
        if (data.containsKey("esocialCertificateId")) 
            integration.setEsocialCertificateId((String) data.get("esocialCertificateId"));

        if (data.containsKey("accountingSoftware")) 
            integration.setAccountingSoftware((String) data.get("accountingSoftware"));

        if (data.containsKey("accountingApiKey")) 
            integration.setAccountingApiKey((String) data.get("accountingApiKey"));

        if (data.containsKey("accountingApiUrl")) 
            integration.setAccountingApiUrl((String) data.get("accountingApiUrl"));

        if (data.containsKey("erpSystem")) 
            integration.setErpSystem((String) data.get("erpSystem"));

        if (data.containsKey("erpApiUrl")) 
            integration.setErpApiUrl((String) data.get("erpApiUrl"));

        if (data.containsKey("erpAuthToken")) 
            integration.setErpAuthToken((String) data.get("erpAuthToken"));

        if (data.containsKey("benefitsProvider")) 
            integration.setBenefitsProvider((String) data.get("benefitsProvider"));

        if (data.containsKey("benefitsApiKey")) 
            integration.setBenefitsApiKey((String) data.get("benefitsApiKey"));

        integrationRepository.save(integration);
    }

    private void processDataImport(UUID tenantId, Map<String, Object> data) {
        log.info("Processando importação de dados para o tenant: {}", tenantId);
        if (data == null || !data.containsKey("employees")) return;

        Object employeesObj = data.get("employees");
        if (!(employeesObj instanceof List<?> employeesList)) return;

        log.info("Migrando {} colaboradores do setup para o tenant {}", employeesList.size(), tenantId);

        for (Object item : employeesList) {
            if (item instanceof Map<?, ?> empMap) {
                try {
                    String fullName = (String) empMap.get("nome");
                    String cpf = ((String) empMap.get("cpf")).replaceAll("[^0-9]", "");
                    String email = (String) empMap.get("email");
                    
                    // Native insert use JPA EntityManager for simplicity since they share DB
                    entityManager.createNativeQuery(
                        "INSERT INTO employees (id, tenant_id, full_name, cpf, email, status, is_active, birth_date, hire_date, employment_type, created_at) " +
                        "VALUES (?, ?, ?, ?, ?, 'ACTIVE', true, '1990-01-01', CURRENT_DATE, 'CLT', CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (tenant_id, cpf) DO NOTHING")
                        .setParameter(1, UUID.randomUUID())
                        .setParameter(2, tenantId)
                        .setParameter(3, fullName)
                        .setParameter(4, cpf)
                        .setParameter(5, email != null ? email : "import@axonrh.com")
                        .executeUpdate();
                } catch (Exception e) {
                    log.error("Erro ao migrar colaborador individual: {}", e.getMessage());
                }
            }
        }
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
