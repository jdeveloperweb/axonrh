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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
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
@RequiredArgsConstructor
public class VacationService {

    private final VacationPeriodRepository periodRepository;
    private final VacationRequestRepository requestRepository;
    private final VacationCalculationService calculationService;
    private final VacationDocumentService documentService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

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
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

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
        log.info("Periodo aquisitivo criado - colaborador: {}, periodo: {} a {}",
                employeeId, acquisitionStart, acquisitionEnd);

        return saved;
    }

    /**
     * Gera proximo periodo aquisitivo.
     */
    @Transactional
    public VacationPeriod createNextPeriod(UUID employeeId, String employeeName) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        // Buscar ultimo periodo
        VacationPeriod lastPeriod = periodRepository
                .findTopByTenantIdAndEmployeeIdOrderByAcquisitionEndDateDesc(tenantId, employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Nenhum periodo anterior encontrado"));

        // Novo periodo inicia no dia seguinte ao fim do anterior
        LocalDate newStart = lastPeriod.getAcquisitionEndDate().plusDays(1);

        return createPeriod(employeeId, employeeName, newStart);
    }

    /**
     * Lista periodos de um colaborador.
     */
    @Transactional(readOnly = true)
    public List<VacationPeriodResponse> getEmployeePeriods(UUID employeeId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        List<VacationPeriod> periods = periodRepository
                .findByTenantIdAndEmployeeIdOrderByAcquisitionStartDateDesc(tenantId, employeeId);

        return periods.stream().map(this::toPeriodResponse).toList();
    }

    /**
     * Busca periodos proximos de expirar (T159).
     */
    @Transactional(readOnly = true)
    public List<VacationPeriodResponse> getExpiringPeriods(int daysThreshold) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        LocalDate thresholdDate = LocalDate.now().plusDays(daysThreshold);

        List<VacationPeriod> periods = periodRepository
                .findExpiringPeriods(tenantId, LocalDate.now(), thresholdDate);

        return periods.stream().map(this::toPeriodResponse).toList();
    }

    // ==================== Solicitacoes de Ferias (T160-T162) ====================

    /**
     * Cria solicitacao de ferias.
     */
    @Transactional
    public VacationRequestResponse createRequest(VacationRequestCreateDTO dto, UUID employeeId, String employeeName) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

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

        publishEvent("VACATION_REQUESTED", saved);

        log.info("Solicitacao de ferias criada - colaborador: {}, periodo: {} a {}",
                employeeId, dto.getStartDate(), dto.getEndDate());

        return toRequestResponse(saved);
    }

    /**
     * Aprova solicitacao de ferias (T162).
     */
    @Transactional
    public VacationRequestResponse approveRequest(UUID requestId, String notes, UUID approverId, String approverName) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        VacationRequest request = requestRepository.findByTenantIdAndId(tenantId, requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitacao nao encontrada"));

        if (request.getStatus() != VacationRequestStatus.PENDING) {
            throw new InvalidOperationException("Solicitacao nao esta pendente");
        }

        // Atualizar dias usados no periodo
        VacationPeriod period = request.getVacationPeriod();
        period.setUsedDays(period.getUsedDays() + request.getDaysCount());
        if (request.getSellDays() && request.getSoldDaysCount() > 0) {
            period.setSoldDays(period.getSoldDays() + request.getSoldDaysCount());
        }
        periodRepository.save(period);

        // Calcular data de pagamento (2 dias antes do inicio - CLT)
        LocalDate paymentDate = request.getStartDate().minusDays(2);
        if (paymentDate.isBefore(LocalDate.now())) {
            paymentDate = LocalDate.now();
        }

        // Atualizar solicitacao
        request.setStatus(VacationRequestStatus.APPROVED);
        request.setApproverId(approverId);
        request.setApproverName(approverName);
        request.setApprovedAt(LocalDateTime.now());
        request.setApprovalNotes(notes);
        request.setPaymentDate(paymentDate);

        VacationRequest saved = requestRepository.save(request);

        // Atualizar status do periodo
        updatePeriodStatus(period);

        publishEvent("VACATION_APPROVED", saved);

        log.info("Ferias aprovadas - solicitacao: {}, aprovador: {}", requestId, approverId);

        return toRequestResponse(saved);
    }

    /**
     * Rejeita solicitacao de ferias.
     */
    @Transactional
    public VacationRequestResponse rejectRequest(UUID requestId, String reason, UUID approverId, String approverName) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        VacationRequest request = requestRepository.findByTenantIdAndId(tenantId, requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitacao nao encontrada"));

        if (request.getStatus() != VacationRequestStatus.PENDING) {
            throw new InvalidOperationException("Solicitacao nao esta pendente");
        }

        request.setStatus(VacationRequestStatus.REJECTED);
        request.setApproverId(approverId);
        request.setApproverName(approverName);
        request.setApprovedAt(LocalDateTime.now());
        request.setRejectionReason(reason);

        VacationRequest saved = requestRepository.save(request);

        publishEvent("VACATION_REJECTED", saved);

        log.info("Ferias rejeitadas - solicitacao: {}, motivo: {}", requestId, reason);

        return toRequestResponse(saved);
    }

    /**
     * Cancela solicitacao de ferias.
     */
    @Transactional
    public VacationRequestResponse cancelRequest(UUID requestId, UUID employeeId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        VacationRequest request = requestRepository.findByTenantIdAndId(tenantId, requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitacao nao encontrada"));

        if (!request.getEmployeeId().equals(employeeId)) {
            throw new InvalidOperationException("Apenas o solicitante pode cancelar");
        }

        if (!request.canCancel()) {
            throw new InvalidOperationException("Solicitacao nao pode ser cancelada");
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
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        return requestRepository
                .findByTenantIdAndStatusOrderByCreatedAtAsc(tenantId, VacationRequestStatus.PENDING, pageable)
                .map(this::toRequestResponse);
    }

    /**
     * Lista solicitacoes de um colaborador.
     */
    @Transactional(readOnly = true)
    public List<VacationRequestResponse> getEmployeeRequests(UUID employeeId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        return requestRepository
                .findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(tenantId, employeeId)
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

    // ==================== Geracao de Documentos (T163) ====================

    /**
     * Gera aviso de ferias.
     */
    @Transactional
    public String generateNotice(UUID requestId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

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
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

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
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        long existingFractions = requestRepository.countByVacationPeriodIdAndStatusNot(
                period.getId(), VacationRequestStatus.CANCELLED);

        if (existingFractions >= maxFractions) {
            throw new InvalidOperationException(
                    String.format("Maximo de %d fracoes permitido", maxFractions));
        }

        // Uma das fracoes deve ter no minimo 14 dias (CLT)
        if (dto.getFractionNumber() == 1 && requestedDays < 14) {
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
            case PENDING -> "Pendente";
            case APPROVED -> "Aprovada";
            case REJECTED -> "Rejeitada";
            case CANCELLED -> "Cancelada";
            case SCHEDULED -> "Agendada";
            case IN_PROGRESS -> "Em Andamento";
            case COMPLETED -> "Concluída";
        };
    }

    private void publishEvent(String eventType, VacationRequest request) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("tenantId", request.getTenantId().toString());
        event.put("requestId", request.getId().toString());
        event.put("employeeId", request.getEmployeeId().toString());
        event.put("status", request.getStatus().name());
        event.put("startDate", request.getStartDate().toString());
        event.put("endDate", request.getEndDate().toString());
        event.put("timestamp", LocalDateTime.now().toString());

        kafkaTemplate.send("vacation.domain.events", request.getEmployeeId().toString(), event);
    }
}
