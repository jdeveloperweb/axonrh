package com.axonrh.vacation.service;

import com.axonrh.vacation.config.TenantContext;
import com.axonrh.vacation.dto.*;
import com.axonrh.vacation.entity.VacationPeriod;
import com.axonrh.vacation.entity.VacationRequest;
import com.axonrh.vacation.entity.enums.VacationPeriodStatus;
import com.axonrh.vacation.entity.enums.VacationRequestStatus;
import com.axonrh.vacation.entity.enums.VacationRequestType;
import com.axonrh.vacation.exception.InvalidOperationException;
import com.axonrh.vacation.exception.ResourceNotFoundException;
import com.axonrh.vacation.repository.VacationPeriodRepository;
import com.axonrh.vacation.repository.VacationRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import com.axonrh.vacation.client.EmployeeServiceClient;
import com.axonrh.vacation.dto.EmployeeDTO;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * T158-T163 - Servico principal de gestao de ferias.
 */
@Slf4j
@Service
public class VacationService {

    private final VacationPeriodRepository periodRepository;
    private final VacationRequestRepository requestRepository;
    private final VacationCalculationService calculationService;
    private final VacationDocumentService documentService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final EmployeeServiceClient employeeServiceClient;

    public VacationService(
            VacationPeriodRepository periodRepository,
            VacationRequestRepository requestRepository,
            VacationCalculationService calculationService,
            VacationDocumentService documentService,
            @Qualifier("vacationKafkaTemplate") KafkaTemplate<String, Object> kafkaTemplate,
            EmployeeServiceClient employeeServiceClient) {
        this.periodRepository = periodRepository;
        this.requestRepository = requestRepository;
        this.calculationService = calculationService;
        this.documentService = documentService;
        this.kafkaTemplate = kafkaTemplate;
        this.employeeServiceClient = employeeServiceClient;
    }

    @Value("${vacation.min-advance-days:30}")
    private int minAdvanceDays;

    @Value("${vacation.max-sell-days:10}")
    private int maxSellDays;

    @Value("${vacation.max-fractions:3}")
    private int maxFractions;

    @Value("${vacation.min-fraction-days:5}")
    private int minFractionDays;

    // ==================== Periodos Aquisitivos (T158) ====================

    /**
     * Cria periodo aquisitivo para um colaborador.
     * Chamado automaticamente na admissao.
     */
    @Transactional
    public VacationPeriod createPeriod(UUID employeeId, String employeeName, LocalDate admissionDate) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            throw new InvalidOperationException("Tenant context missing");
        }
        UUID tenantId = UUID.fromString(tenantStr);
        return createPeriod(tenantId, employeeId, employeeName, admissionDate);
    }

    /**
     * Cria periodo aquisitivo para um colaborador (uso interno/listeners).
     */
    @Transactional
    public VacationPeriod createPeriod(UUID tenantId, UUID employeeId, String employeeName, LocalDate admissionDate) {
        // Verificar se ja existe periodo para esta data de inicio
        Optional<VacationPeriod> existing = periodRepository
                .findByTenantIdAndEmployeeIdAndAcquisitionStartDate(tenantId, employeeId, admissionDate);
        
        if (existing.isPresent()) {
            log.info("Periodo aquisitivo ja existe para o colaborador: {} na data: {}", employeeName, admissionDate);
            return existing.get();
        }

        // Calcular datas do periodo aquisitivo
        LocalDate acquisitionStart = admissionDate;
        LocalDate acquisitionEnd = admissionDate.plusYears(1).minusDays(1);
        LocalDate concessionStart = acquisitionEnd.plusDays(1);
        LocalDate concessionEnd = concessionStart.plusYears(1).minusDays(1);

        VacationPeriod period = VacationPeriod.builder()
                .tenantId(tenantId)
                .employeeId(employeeId)
                .employeeName(employeeName)
                .acquisitionStartDate(acquisitionStart)
                .acquisitionEndDate(acquisitionEnd)
                .concessionStartDate(concessionStart)
                .concessionEndDate(concessionEnd)
                .totalDays(30)
                .usedDays(0)
                .soldDays(0)
                .status(VacationPeriodStatus.OPEN)
                .build();

        VacationPeriod saved = periodRepository.save(period);
        log.info("Periodo aquisitivo criado - tenant: {}, colaborador: {}, periodo: {} a {}",
                tenantId, employeeId, acquisitionStart, acquisitionEnd);

        return saved;
    }

    /**
     * Gera proximo periodo aquisitivo.
     */
    @Transactional
    public VacationPeriod createNextPeriod(UUID employeeId, String employeeName) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            throw new InvalidOperationException("Tenant context missing");
        }
        UUID tenantId = UUID.fromString(tenantStr);

        // Buscar ultimo periodo
        VacationPeriod lastPeriod = periodRepository
                .findTopByTenantIdAndEmployeeIdOrderByAcquisitionEndDateDesc(tenantId, employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Nenhum periodo anterior encontrado"));

        // Novo periodo inicia no dia seguinte ao fim do anterior
        LocalDate newStart = lastPeriod.getAcquisitionEndDate().plusDays(1);

        return createPeriod(employeeId, employeeName, newStart);
    }

    /**
     * Sincroniza periodos aquisitivos para todos os colaboradores do tenant.
     * Util para quando o servico e ativado apos a admissao de funcionarios.
     */
    @Transactional
    public void syncPeriods() {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            throw new InvalidOperationException("Tenant context missing");
        }
        UUID tenantId = UUID.fromString(tenantStr);
        log.info("Iniciando sincronizacao de periodos para tenant: {}", tenantId);

        try {
            List<EmployeeDTO> employees = employeeServiceClient.getActiveEmployees();
            for (EmployeeDTO emp : employees) {
                // Verificar se ja tem periodo
                Optional<VacationPeriod> existing = periodRepository
                        .findTopByTenantIdAndEmployeeIdOrderByAcquisitionEndDateDesc(tenantId, emp.getId());
                
                if (existing.isEmpty() && emp.getHireDate() != null) {
                    log.info("Criando periodo inicial para colaborador sincronizado: {}", emp.getFullName());
                    createPeriod(tenantId, emp.getId(), emp.getFullName(), emp.getHireDate());
                }
            }
        } catch (Exception e) {
            log.error("Erro ao sincronizar periodos", e);
            throw new InvalidOperationException("Falha ao sincronizar periodos com o Employee Service");
        }
    }

    /**
     * Resolve o employeeId a partir do userId.
     */
    @Transactional(readOnly = true)
    public UUID resolveEmployeeId(UUID userId) {
        if (userId == null) return null;
        log.debug("Resolvendo employeeId para userId: {}", userId);
        
        String email = null;
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwt) {
                email = (String) jwt.getTokenAttributes().get("email");
            }
        } catch (Exception e) {
            log.warn("Nao foi possivel obter email do contexto de seguranca: {}", e.getMessage());
        }

        try {
            EmployeeDTO employee = employeeServiceClient.getEmployeeByUserId(userId, email);
            if (employee != null) {
                log.debug("Colaborador encontrado: {} (ID: {})", employee.getFullName(), employee.getId());
                return employee.getId();
            }
        } catch (Exception e) {
            log.warn("Nao foi possivel encontrar colaborador para o userId: {}. Causa: {}. Usando proprio ID como fallback.", 
                userId, e.getMessage());
        }
        return userId;
    }


    /**
     * Lista periodos de um colaborador.
     */
    @Transactional(readOnly = true)
    public List<VacationPeriodResponse> getEmployeePeriods(UUID employeeId) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            log.error("Tentativa de buscar periodos sem contexto de Tenant!");
            return Collections.emptyList();
        }
        UUID tenantId = UUID.fromString(tenantStr);
        String photoUrl = null;
        try {
            EmployeeDTO emp = employeeServiceClient.getEmployee(employeeId);
            if (emp != null) photoUrl = emp.getPhotoUrl();
        } catch (Exception e) {
            log.warn("Nao foi possivel carregar foto do colaborador {}: {}", employeeId, e.getMessage());
        }

        List<VacationPeriod> periods = periodRepository
                .findByTenantIdAndEmployeeIdOrderByAcquisitionStartDateDesc(tenantId, employeeId);

        final String finalPhotoUrl = photoUrl;
        return periods.stream()
                .map(this::toPeriodResponse)
                .peek(resp -> resp.setEmployeePhotoUrl(finalPhotoUrl))
                .toList();
    }

    /**
     * Busca periodos proximos de expirar (T159).
     */
    @Transactional(readOnly = true)
    public List<VacationPeriodResponse> getExpiringPeriods(int daysThreshold) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            log.error("Tentativa de buscar periodos expirando sem contexto de Tenant!");
            return Collections.emptyList();
        }
        UUID tenantId = UUID.fromString(tenantStr);
        LocalDate thresholdDate = LocalDate.now().plusDays(daysThreshold);

        List<VacationPeriod> periods = periodRepository
                .findExpiringPeriods(tenantId, LocalDate.now(), thresholdDate);

        // Fetch employees to get photos
        Map<UUID, String> photoMap = new HashMap<>();
        try {
            List<EmployeeDTO> employees = employeeServiceClient.getActiveEmployees();
            for (EmployeeDTO emp : employees) {
                if (emp.getPhotoUrl() != null) {
                    photoMap.put(emp.getId(), emp.getPhotoUrl());
                }
            }
        } catch (Exception e) {
            log.warn("Nao foi possivel carregar fotos dos colaboradores: {}", e.getMessage());
        }

        return periods.stream()
                .map(p -> {
                    VacationPeriodResponse resp = toPeriodResponse(p);
                    resp.setEmployeePhotoUrl(photoMap.get(p.getEmployeeId()));
                    return resp;
                })
                .toList();
    }

    // ==================== Solicitacoes de Ferias (T160-T162) ====================

    /**
     * Cria solicitacao de ferias.
     */
    @Transactional
    public VacationRequestResponse createRequest(VacationRequestCreateDTO dto, UUID employeeId, String employeeName) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            throw new InvalidOperationException("Tenant context missing");
        }
        UUID tenantId = UUID.fromString(tenantStr);

        // Buscar periodo aquisitivo
        VacationPeriod period = periodRepository.findByTenantIdAndId(tenantId, dto.getVacationPeriodId())
                .orElseThrow(() -> new ResourceNotFoundException("Periodo aquisitivo nao encontrado"));

        // Validacoes
        validateRequest(period, dto);

        // Calcular dias
        int daysCount = (int) ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate()) + 1;

        VacationRequest request = VacationRequest.builder()
                .tenantId(tenantId)
                .employeeId(employeeId)
                .employeeName(employeeName)
                .vacationPeriod(period)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .daysCount(daysCount)
                .requestType(dto.isFractioned() ? VacationRequestType.FRACTIONED : VacationRequestType.REGULAR)
                .fractionNumber(dto.getFractionNumber())
                .sellDays(dto.isSellDays())
                .soldDaysCount(dto.getSoldDaysCount() != null ? dto.getSoldDaysCount() : 0)
                .advance13thSalary(dto.isAdvance13thSalary())
                .status(VacationRequestStatus.PENDING)
                .notes(dto.getNotes())
                .createdBy(employeeId)
                .build();

        VacationRequest saved = requestRepository.save(request);

        // Atualizar status do periodo
        updatePeriodStatus(period);

        // Buscar gestor para notificacao
        UUID managerId = null;
        UUID managerUserId = null;
        try {
            EmployeeDTO employee = employeeServiceClient.getEmployee(employeeId);
            if (employee != null && employee.getManager() != null) {
                managerId = employee.getManager().getId();
                // Tenta pegar userId do objeto aninhado ou busca o manager
                if (employee.getManager().getUserId() != null) {
                    managerUserId = employee.getManager().getUserId();
                } else {
                    try {
                        EmployeeDTO manager = employeeServiceClient.getEmployee(managerId);
                        managerUserId = manager.getUserId();
                    } catch (Exception ex) {
                        log.warn("Nao foi possivel buscar detalhes do gestor {}", managerId);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erro ao buscar gestor do colaborador {}", employeeId, e);
        }

        publishEvent("VACATION_REQUESTED", saved, managerId, managerUserId);

        log.info("Solicitacao de ferias criada - colaborador: {}, periodo: {} a {}",
                employeeId, dto.getStartDate(), dto.getEndDate());

        return toRequestResponse(saved);
    }

    @Transactional
    public VacationRequestResponse approveRequest(UUID requestId, String notes, UUID approverId, String approverName, List<String> userRoles) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            throw new InvalidOperationException("Tenant context missing");
        }
        UUID tenantId = UUID.fromString(tenantStr);

        boolean isRH = userRoles != null && userRoles.stream()
                .anyMatch(r -> r.equalsIgnoreCase("RH") || 
                               r.equalsIgnoreCase("ROLE_RH") || 
                               r.equalsIgnoreCase("ADMIN") || 
                               r.equalsIgnoreCase("ROLE_ADMIN") ||
                               r.equalsIgnoreCase("GESTOR_RH") ||
                               r.equalsIgnoreCase("ROLE_GESTOR_RH"));

        VacationRequest request = requestRepository.findByTenantIdAndId(tenantId, requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitacao nao encontrada"));

        VacationPeriod period = request.getVacationPeriod();

        if (request.getStatus() == VacationRequestStatus.PENDING) {
            if (isRH) {
                // Admin/RH aprovando: pula direto para aprovado
                finalizeApproval(request, notes, approverId, approverName, period);
                log.info("Ferias aprovadas direto pelo Admin/RH - solicitacao: {}, aprovador: {}", requestId, approverId);
            } else {
                // Gestor comum aprovando: vai para aprovação do RH
                request.setStatus(VacationRequestStatus.MANAGER_APPROVED);
                request.setApprovalNotes(notes != null ? "Gestor: " + notes : null);
                log.info("Ferias aprovadas pelo gestor - solicitacao: {}, aprovador: {}", requestId, approverId);
            }
        } else if (request.getStatus() == VacationRequestStatus.MANAGER_APPROVED) {
            if (!isRH) {
                throw new InvalidOperationException("Apenas RH pode realizar a aprovacao final.");
            }
            finalizeApproval(request, notes, approverId, approverName, period);
            log.info("Ferias aprovadas final (RH) - solicitacao: {}, aprovador: {}", requestId, approverId);
        } else {
            throw new InvalidOperationException("Solicitacao nao esta pendente de aprovacao");
        }

        VacationRequest saved = requestRepository.save(request);
        publishEvent("VACATION_APPROVED", saved, null, null);

        return toRequestResponse(saved);
    }

    private void finalizeApproval(VacationRequest request, String notes, UUID approverId, String approverName, VacationPeriod period) {
        request.setStatus(VacationRequestStatus.APPROVED);
        
        String currentNotes = request.getApprovalNotes() != null ? request.getApprovalNotes() : "";
        if (notes != null && !notes.isEmpty()) {
            if (!currentNotes.isEmpty()) {
                request.setApprovalNotes(currentNotes + " | RH: " + notes);
            } else {
                request.setApprovalNotes("RH: " + notes);
            }
        }
        
        request.setApproverId(approverId);
        request.setApproverName(approverName);
        request.setApprovedAt(LocalDateTime.now());

        // Atualizar dias usados no periodo
        period.setUsedDays(period.getUsedDays() + request.getDaysCount());
        if (request.getSellDays() && request.getSoldDaysCount() > 0) {
            period.setSoldDays(period.getSoldDays() + request.getSoldDaysCount());
        }
        periodRepository.save(period);
        updatePeriodStatus(period);

        // Calcular data de pagamento (2 dias antes do inicio - CLT)
        LocalDate paymentDate = request.getStartDate().minusDays(2);
        if (paymentDate.isBefore(LocalDate.now())) {
            paymentDate = LocalDate.now();
        }
        request.setPaymentDate(paymentDate);
    }
    
    /**
     * Lista solicitacoes aguardando aprovacao do RH (MANAGER_APPROVED).
     */
    @Transactional(readOnly = true)
    public Page<VacationRequestResponse> getManagerApprovedRequests(Pageable pageable) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) return Page.empty();
        UUID tenantId = UUID.fromString(tenantStr);

        return requestRepository
                .findByTenantIdAndStatusOrderByCreatedAtAsc(tenantId, VacationRequestStatus.MANAGER_APPROVED, pageable)
                .map(this::toRequestResponse);
    }

    @Transactional
    public VacationRequestResponse rejectRequest(UUID requestId, String reason, UUID approverId, String approverName, List<String> userRoles) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            throw new InvalidOperationException("Tenant context missing");
        }
        UUID tenantId = UUID.fromString(tenantStr);

        VacationRequest request = requestRepository.findByTenantIdAndId(tenantId, requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitacao nao encontrada"));

        boolean isRH = userRoles != null && userRoles.stream()
                .anyMatch(r -> r.equalsIgnoreCase("RH") || 
                               r.equalsIgnoreCase("ROLE_RH") || 
                               r.equalsIgnoreCase("ADMIN") || 
                               r.equalsIgnoreCase("ROLE_ADMIN") ||
                               r.equalsIgnoreCase("GESTOR_RH") ||
                               r.equalsIgnoreCase("ROLE_GESTOR_RH"));

        if (!isRH && request.getStatus() != VacationRequestStatus.PENDING) {
            throw new InvalidOperationException("Solicitacao nao esta pendente de aprovacao do gestor");
        }

        if (isRH && request.getStatus() != VacationRequestStatus.PENDING && request.getStatus() != VacationRequestStatus.MANAGER_APPROVED) {
             throw new InvalidOperationException("RH so pode rejeitar solicitacoes pendentes ou ja aprovadas pelo gestor");
        }

        request.setStatus(VacationRequestStatus.REJECTED);
        request.setApproverId(approverId);
        request.setApproverName(approverName);
        request.setApprovedAt(LocalDateTime.now());
        request.setRejectionReason(reason);

        VacationRequest saved = requestRepository.save(request);

        publishEvent("VACATION_REJECTED", saved, null, null);

        log.info("Ferias rejeitadas - solicitacao: {}, motivo: {}, por: {}", requestId, reason, approverName);

        return toRequestResponse(saved);
    }

    @Transactional
    public VacationRequestResponse cancelRequest(UUID requestId, UUID userId, List<String> userRoles) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            throw new InvalidOperationException("Tenant context missing");
        }
        UUID tenantId = UUID.fromString(tenantStr);

        VacationRequest request = requestRepository.findByTenantIdAndId(tenantId, requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitacao nao encontrada"));

        boolean isRH = userRoles != null && userRoles.stream()
                .anyMatch(r -> r.equalsIgnoreCase("RH") || 
                               r.equalsIgnoreCase("ROLE_RH") || 
                               r.equalsIgnoreCase("ADMIN") || 
                               r.equalsIgnoreCase("ROLE_ADMIN") ||
                               r.equalsIgnoreCase("GESTOR_RH") ||
                               r.equalsIgnoreCase("ROLE_GESTOR_RH"));

        UUID requesterEmployeeId = resolveEmployeeId(userId);

        if (!isRH && !request.getEmployeeId().equals(requesterEmployeeId)) {
            throw new InvalidOperationException("Apenas o solicitante ou RH podem cancelar");
        }

        if (!request.canCancel()) {
            throw new InvalidOperationException("Solicitacao nao pode ser cancelada no status atual: " + request.getStatus());
        }

        // Se ja estava aprovada, devolver dias ao periodo
        if (request.getStatus() == VacationRequestStatus.APPROVED) {
            VacationPeriod period = request.getVacationPeriod();
            period.setUsedDays(period.getUsedDays() - request.getDaysCount());
            if (request.getSellDays() && request.getSoldDaysCount() > 0) {
                period.setSoldDays(period.getSoldDays() - request.getSoldDaysCount());
            }
            periodRepository.save(period);
            updatePeriodStatus(period);
        }

        request.setStatus(VacationRequestStatus.CANCELLED);

        VacationRequest saved = requestRepository.save(request);

        log.info("Ferias canceladas - solicitacao: {}", requestId);

        return toRequestResponse(saved);
    }

    /**
     * Lista solicitacoes pendentes de aprovacao.
     */
    @Transactional(readOnly = true)
    public Page<VacationRequestResponse> getPendingRequests(Pageable pageable) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            log.error("Tentativa de buscar pendencias sem contexto de Tenant!");
            return Page.empty();
        }
        UUID tenantId = UUID.fromString(tenantStr);

        return requestRepository
                .findByTenantIdAndStatusOrderByCreatedAtAsc(tenantId, VacationRequestStatus.PENDING, pageable)
                .map(this::toRequestResponse);
    }

    /**
     * Lista todas as solicitacoes pendentes (para RH/Admin).
     */
    @Transactional(readOnly = true)
    public Page<VacationRequestResponse> getAllPendingRequests(Pageable pageable) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            log.error("Tentativa de buscar todas as pendencias sem contexto de Tenant!");
            return Page.empty();
        }
        UUID tenantId = UUID.fromString(tenantStr);

        return requestRepository
                .findByTenantIdAndStatusOrderByCreatedAtAsc(tenantId, VacationRequestStatus.PENDING, pageable)
                .map(this::toRequestResponse);
    }

    /**
     * Lista solicitacoes pendentes de subordinados (T162).
     */
    @Transactional(readOnly = true)
    public Page<VacationRequestResponse> getPendingRequestsForManager(UUID managerId, Pageable pageable) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            log.error("Tentativa de buscar pendencias do gestor sem contexto de Tenant!");
            return Page.empty();
        }
        UUID tenantId = UUID.fromString(tenantStr);
        
        List<UUID> subordinateIds = new ArrayList<>();
        try {
            // Resolver o employeeId do gestor (pois managerId aqui eh o userId)
            UUID managerEmployeeId = resolveEmployeeId(managerId);
            List<EmployeeDTO> subordinates = employeeServiceClient.getSubordinates(managerEmployeeId);
            if (subordinates != null) {
                subordinateIds = subordinates.stream()
                        .map(EmployeeDTO::getId)
                        .toList();
            }
        } catch (Exception e) {
            log.error("Erro ao buscar subordinados do gestor {}", managerId, e);
            // Em caso de erro, retorna vazio ou comportamento fallback
            return Page.empty();
        }

        if (subordinateIds.isEmpty()) {
            return Page.empty();
        }

        return requestRepository
                .findByTenantIdAndStatusAndEmployeeIdInOrderByCreatedAtAsc(
                        tenantId, VacationRequestStatus.PENDING, subordinateIds, pageable)
                .map(this::toRequestResponse);
    }

    /**
     * Lista solicitacoes de um colaborador.
     */
    @Transactional(readOnly = true)
    public List<VacationRequestResponse> getEmployeeRequests(UUID employeeId) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            log.error("Tentativa de buscar solicitacoes sem contexto de Tenant!");
            return Collections.emptyList();
        }
        UUID tenantId = UUID.fromString(tenantStr);

        return requestRepository
                .findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(tenantId, employeeId)
                .stream()
                .map(this::toRequestResponse)
                .toList();
    }

    /**
     * Lista ferias em um periodo (Calendar).
     */
    @Transactional(readOnly = true)
    public List<VacationRequestResponse> getCalendarRequests(LocalDate from, LocalDate to) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            log.error("Tentativa de buscar calendario sem contexto de Tenant!");
            return Collections.emptyList();
        }
        UUID tenantId = UUID.fromString(tenantStr);

        return requestRepository
                .findByTenantIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        tenantId, VacationRequestStatus.APPROVED, to, from)
                .stream()
                .map(this::toRequestResponse)
                .toList();
    }

    // ==================== Simulador de Valores (T161) ====================

    /**
     * Simula valores de ferias.
     */
    @Transactional(readOnly = true)
    public VacationSimulationResponse simulate(VacationSimulationRequest request) {
        return calculationService.simulate(request);
    }

    /**
     * Busca estatísticas gerais de férias para o tenant.
     */
    @Transactional(readOnly = true)
    public VacationStatisticsResponse getStatistics() {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            log.error("Tentativa de buscar estatisticas sem contexto de Tenant!");
            return VacationStatisticsResponse.builder().build();
        }
        UUID tenantId = UUID.fromString(tenantStr);
        LocalDate today = LocalDate.now();

        long pending = requestRepository.countByTenantIdAndStatus(tenantId, VacationRequestStatus.PENDING);
        
        long expiring = periodRepository.findExpiringPeriods(tenantId, today, today.plusDays(60)).size();
        
        long onVacation = requestRepository.findByTenantIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                tenantId, VacationRequestStatus.APPROVED, today, today).size();
        
        long upcoming = requestRepository.countByTenantIdAndStatusAndStartDateAfter(
                tenantId, VacationRequestStatus.APPROVED, today);

        return VacationStatisticsResponse.builder()
                .pendingRequests(pending)
                .expiringPeriods(expiring)
                .employeesOnVacation(onVacation)
                .upcomingVacations(upcoming)
                .build();
    }

    // ==================== Geracao de Documentos (T163) ====================

    /**
     * Gera aviso de ferias.
     */
    @Transactional
    public String generateNotice(UUID requestId) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            throw new InvalidOperationException("Tenant context missing");
        }
        UUID tenantId = UUID.fromString(tenantStr);

        VacationRequest request = requestRepository.findByTenantIdAndId(tenantId, requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitacao nao encontrada"));

        if (request.getStatus() != VacationRequestStatus.APPROVED) {
            throw new InvalidOperationException("Solicitacao nao esta aprovada");
        }

        String documentUrl = documentService.generateNotice(request);
        request.setNoticeDocumentUrl(documentUrl);
        requestRepository.save(request);

        return documentUrl;
    }

    /**
     * Gera recibo de ferias.
     */
    @Transactional
    public String generateReceipt(UUID requestId) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            throw new InvalidOperationException("Tenant context missing");
        }
        UUID tenantId = UUID.fromString(tenantStr);

        VacationRequest request = requestRepository.findByTenantIdAndId(tenantId, requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitacao nao encontrada"));

        if (request.getStatus() != VacationRequestStatus.APPROVED) {
            throw new InvalidOperationException("Solicitacao nao esta aprovada");
        }

        String documentUrl = documentService.generateReceipt(request);
        request.setReceiptDocumentUrl(documentUrl);
        requestRepository.save(request);

        return documentUrl;
    }

    // ==================== Alertas de Vencimento (T159) ====================

    /**
     * Job agendado para verificar periodos expirando.
     */
    @Scheduled(cron = "0 0 8 * * MON-FRI") // Toda manha de dia util as 8h
    @Transactional
    public void checkExpiringPeriods() {
        log.info("Verificando periodos de ferias proximos de expirar...");

        // Buscar todos os tenants ativos e verificar periodos
        // Implementacao simplificada - em producao, iterar por tenants
    }

    // ==================== Metodos Privados ====================

    private void validateRequest(VacationPeriod period, VacationRequestCreateDTO dto) {
        // Verificar se periodo permite solicitacao
        if (!period.canRequest()) {
            throw new InvalidOperationException("Periodo nao permite novas solicitacoes");
        }

        // Verificar dias disponiveis
        int requestedDays = (int) ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate()) + 1;
        int soldDays = dto.getSoldDaysCount() != null ? dto.getSoldDaysCount() : 0;
        int totalNeeded = requestedDays + soldDays;

        if (totalNeeded > period.getRemainingDays()) {
            throw new InvalidOperationException(
                    String.format("Dias insuficientes. Disponivel: %d, Solicitado: %d",
                            period.getRemainingDays(), totalNeeded));
        }

        // Verificar antecedencia minima
        long daysUntilStart = ChronoUnit.DAYS.between(LocalDate.now(), dto.getStartDate());
        if (daysUntilStart < minAdvanceDays) {
            throw new InvalidOperationException(
                    String.format("Antecedencia minima de %d dias", minAdvanceDays));
        }

        // Verificar abono pecuniario
        if (dto.isSellDays() && soldDays > maxSellDays) {
            throw new InvalidOperationException(
                    String.format("Maximo de %d dias para abono", maxSellDays));
        }

        // Verificar fracionamento (T160)
        if (dto.isFractioned()) {
            validateFractioning(period, dto, requestedDays);
        }

        // Verificar se nao inicia em sabado, domingo ou feriado
        if (dto.getStartDate().getDayOfWeek().getValue() > 5) {
            throw new InvalidOperationException("Ferias nao podem iniciar em final de semana");
        }
    }

    private void validateFractioning(VacationPeriod period, VacationRequestCreateDTO dto, int requestedDays) {
        // Contar fracoes ja existentes
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            throw new InvalidOperationException("Tenant context missing");
        }
        UUID tenantId = UUID.fromString(tenantStr);
        long existingFractions = requestRepository.countByVacationPeriodIdAndStatusNot(
                period.getId(), VacationRequestStatus.CANCELLED);

        if (existingFractions >= maxFractions) {
            throw new InvalidOperationException(
                    String.format("Maximo de %d fracoes permitido", maxFractions));
        }

        // Uma das fracoes deve ter no minimo 14 dias (CLT)
        Integer fractionNumber = dto.getFractionNumber();
        if (fractionNumber != null && fractionNumber == 1 && requestedDays < 14) {
            throw new InvalidOperationException("A primeira fracao deve ter no minimo 14 dias");
        }

        // Demais fracoes no minimo 5 dias
        if (requestedDays < minFractionDays) {
            throw new InvalidOperationException(
                    String.format("Cada fracao deve ter no minimo %d dias", minFractionDays));
        }
    }

    private void updatePeriodStatus(VacationPeriod period) {
        int remaining = period.getRemainingDays();

        if (remaining <= 0) {
            period.setStatus(VacationPeriodStatus.COMPLETED);
            period.setCompletedAt(LocalDate.now());
        } else if (period.getUsedDays() > 0) {
            period.setStatus(VacationPeriodStatus.PARTIALLY_USED);
        } else {
            // Verificar se tem solicitacoes aprovadas/agendadas
            long scheduled = requestRepository.countByVacationPeriodIdAndStatusIn(
                    period.getId(),
                    List.of(VacationRequestStatus.APPROVED, VacationRequestStatus.SCHEDULED));
            if (scheduled > 0) {
                period.setStatus(VacationPeriodStatus.SCHEDULED);
            } else {
                period.setStatus(VacationPeriodStatus.OPEN);
            }
        }

        periodRepository.save(period);
    }

    private VacationPeriodResponse toPeriodResponse(VacationPeriod period) {
        return VacationPeriodResponse.builder()
                .id(period.getId())
                .employeeId(period.getEmployeeId())
                .employeeName(period.getEmployeeName())
                .acquisitionStartDate(period.getAcquisitionStartDate())
                .acquisitionEndDate(period.getAcquisitionEndDate())
                .concessionStartDate(period.getConcessionStartDate())
                .concessionEndDate(period.getConcessionEndDate())
                .totalDays(period.getTotalDays())
                .usedDays(period.getUsedDays())
                .soldDays(period.getSoldDays())
                .remainingDays(period.getRemainingDays())
                .status(period.getStatus())
                .statusLabel(getStatusLabel(period.getStatus()))
                .isExpired(period.isExpired())
                .isExpiringSoon(period.isExpiringSoon(60))
                .daysUntilExpiration(
                        (int) ChronoUnit.DAYS.between(LocalDate.now(), period.getConcessionEndDate()))
                .build();
    }

    private VacationRequestResponse toRequestResponse(VacationRequest request) {
        return VacationRequestResponse.builder()
                .id(request.getId())
                .employeeId(request.getEmployeeId())
                .employeeName(request.getEmployeeName())
                .vacationPeriodId(request.getVacationPeriod().getId())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .daysCount(request.getDaysCount())
                .requestType(request.getRequestType())
                .requestTypeLabel(getRequestTypeLabel(request.getRequestType()))
                .fractionNumber(request.getFractionNumber())
                .sellDays(request.getSellDays())
                .soldDaysCount(request.getSoldDaysCount())
                .advance13thSalary(request.getAdvance13thSalary())
                .status(request.getStatus())
                .statusLabel(getRequestStatusLabel(request.getStatus()))
                .approverId(request.getApproverId())
                .approverName(request.getApproverName())
                .approvedAt(request.getApprovedAt())
                .approvalNotes(request.getApprovalNotes())
                .rejectionReason(request.getRejectionReason())
                .paymentDate(request.getPaymentDate())
                .paymentValue(request.getPaymentValue())
                .noticeDocumentUrl(request.getNoticeDocumentUrl())
                .receiptDocumentUrl(request.getReceiptDocumentUrl())
                .notes(request.getNotes())
                .createdAt(request.getCreatedAt())
                .canCancel(request.canCancel())
                .build();
    }

    private String getStatusLabel(VacationPeriodStatus status) {
        return switch (status) {
            case OPEN -> "Aberto";
            case SCHEDULED -> "Agendado";
            case PARTIALLY_USED -> "Parcialmente Usado";
            case COMPLETED -> "Concluído";
            case EXPIRED -> "Expirado";
            case CANCELLED -> "Cancelado";
        };
    }

    private String getRequestTypeLabel(VacationRequestType type) {
        return switch (type) {
            case REGULAR -> "Regular";
            case COLLECTIVE -> "Coletivas";
            case FRACTIONED -> "Fracionadas";
        };
    }

    private String getRequestStatusLabel(VacationRequestStatus status) {
        return switch (status) {
            case PENDING -> "Pendente (Gestor)";
            case MANAGER_APPROVED -> "Aprovado pelo Gestor (RH)";
            case APPROVED -> " Aprovada";
            case REJECTED -> "Rejeitada";
            case CANCELLED -> "Cancelada";
            case SCHEDULED -> "Agendada";
            case IN_PROGRESS -> "Em Andamento";
            case COMPLETED -> "Concluída";
        };
    }

    /**
     * Envia notificacao de vencimento de periodo.
     */
    @Transactional
    public void sendPeriodExpirationNotification(UUID periodId) {
        VacationPeriod period = periodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Periodo nao encontrado"));

        UUID managerId = null;
        UUID managerUserId = null;
        UUID employeeUserId = null;
        
        try {
            EmployeeDTO employee = employeeServiceClient.getEmployee(period.getEmployeeId());
            if (employee != null) {
                employeeUserId = employee.getUserId();
                if (employee.getManager() != null) {
                    managerId = employee.getManager().getId();
                    if (employee.getManager().getUserId() != null) {
                        managerUserId = employee.getManager().getUserId();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erro ao buscar dados do colaborador para notificacao", e);
        }

        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "VACATION_EXPIRATION_WARNING");
        event.put("tenantId", period.getTenantId().toString());
        event.put("employeeId", period.getEmployeeId().toString());
        event.put("periodId", period.getId().toString());
        event.put("concessionEndDate", period.getConcessionEndDate().toString());
        event.put("timestamp", LocalDateTime.now().toString());
        if (employeeUserId != null) event.put("requesterUserId", employeeUserId.toString());
        if (managerId != null) event.put("managerId", managerId.toString());
        if (managerUserId != null) event.put("managerUserId", managerUserId.toString());

        kafkaTemplate.send("vacation.domain.events", period.getEmployeeId().toString(), event);
        
        log.info("Notificacao de vencimento enviada - periodo: {}", periodId);
    }

    private void publishEvent(String eventType, VacationRequest request, UUID managerId, UUID managerUserId) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("tenantId", request.getTenantId().toString());
        event.put("requestId", request.getId().toString());
        event.put("employeeId", request.getEmployeeId().toString());
        event.put("employeeName", request.getEmployeeName());
        event.put("status", request.getStatus().name());
        event.put("startDate", request.getStartDate().toString());
        event.put("endDate", request.getEndDate().toString());
        event.put("timestamp", LocalDateTime.now().toString());
        
        if (request.getCreatedBy() != null) {
            event.put("requesterUserId", request.getCreatedBy().toString());
        }

        if (managerId != null) {
            event.put("managerId", managerId.toString());
        }
        if (managerUserId != null) {
            event.put("managerUserId", managerUserId.toString());
        }

        // Tentar obter o email do colaborador para a notificação
        try {
            EmployeeDTO employee = employeeServiceClient.getEmployee(request.getEmployeeId());
            if (employee != null) {
                event.put("employeeEmail", employee.getEmail());
            }
        } catch (Exception e) {
            log.warn("Nao foi possivel obter detalhes do colaborador para o evento: {}", e.getMessage());
        }

        kafkaTemplate.send("vacation.domain.events", request.getEmployeeId().toString(), event);
    }
}
