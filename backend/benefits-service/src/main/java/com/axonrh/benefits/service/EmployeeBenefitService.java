package com.axonrh.benefits.service;

import com.axonrh.benefits.config.TenantContext;
import com.axonrh.benefits.dto.*;
import com.axonrh.benefits.entity.BenefitHistory;
import com.axonrh.benefits.entity.BenefitType;
import com.axonrh.benefits.entity.EmployeeBenefit;
import com.axonrh.benefits.enums.BenefitCategory;
import com.axonrh.benefits.enums.CalculationType;
import com.axonrh.benefits.enums.EmployeeBenefitStatus;
import com.axonrh.benefits.exception.BusinessException;
import com.axonrh.benefits.exception.ResourceNotFoundException;
import com.axonrh.benefits.mapper.BenefitHistoryMapper;
import com.axonrh.benefits.mapper.EmployeeBenefitMapper;
import com.axonrh.benefits.repository.BenefitHistoryRepository;
import com.axonrh.benefits.repository.BenefitTypeRepository;
import com.axonrh.benefits.repository.EmployeeBenefitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeBenefitService {

    private final EmployeeBenefitRepository employeeBenefitRepository;
    private final BenefitTypeRepository benefitTypeRepository;
    private final BenefitHistoryRepository benefitHistoryRepository;
    private final EmployeeBenefitMapper employeeBenefitMapper;
    private final BenefitHistoryMapper benefitHistoryMapper;

    private UUID getTenantId() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null || tenant.isBlank()) {
            throw new BusinessException("Tenant nao identificado na requisicao");
        }
        return UUID.fromString(tenant);
    }

    @Transactional
    public EmployeeBenefitResponse assign(EmployeeBenefitRequest request) {
        UUID tenantId = getTenantId();
        log.info("Atribuindo beneficio ao colaborador: {} para tenant: {}",
                request.getEmployeeId(), tenantId);

        BenefitType benefitType = benefitTypeRepository.findByTenantIdAndId(tenantId, request.getBenefitTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tipo de beneficio nao encontrado: " + request.getBenefitTypeId()));

        if (!benefitType.getIsActive()) {
            throw new BusinessException("O tipo de beneficio esta desativado: " + benefitType.getName());
        }

        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.of(9999, 12, 31);
        if (employeeBenefitRepository.existsOverlappingBenefit(
                tenantId, request.getEmployeeId(), request.getBenefitTypeId(),
                request.getStartDate(), endDate)) {
            throw new BusinessException(
                    "O colaborador ja possui o beneficio '" + benefitType.getName() +
                    "' ativo para o periodo informado");
        }

        if (request.getStartDate() != null && request.getEndDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessException("A data fim nao pode ser anterior a data inicio");
        }

        EmployeeBenefit entity = EmployeeBenefit.builder()
                .tenantId(tenantId)
                .employeeId(request.getEmployeeId())
                .employeeName(request.getEmployeeName())
                .benefitType(benefitType)
                .fixedValue(request.getFixedValue() != null ? request.getFixedValue() : benefitType.getDefaultValue())
                .percentage(request.getPercentage() != null ? request.getPercentage() : benefitType.getDefaultPercentage())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(determineInitialStatus(request.getStartDate()))
                .notes(request.getNotes())
                .build();

        EmployeeBenefit saved = employeeBenefitRepository.save(entity);

        recordHistory(saved, "ASSIGNED", null, saved.getFixedValue(),
                null, saved.getPercentage(), null, saved.getStatus().name(),
                "Beneficio atribuido ao colaborador");

        log.info("Beneficio {} atribuido ao colaborador {} com ID: {}",
                benefitType.getName(), request.getEmployeeId(), saved.getId());

        return employeeBenefitMapper.toResponse(saved);
    }

    @Transactional
    public EmployeeBenefitResponse update(UUID id, EmployeeBenefitRequest request) {
        UUID tenantId = getTenantId();
        log.info("Atualizando beneficio {} para tenant {}", id, tenantId);

        EmployeeBenefit entity = employeeBenefitRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficio do colaborador nao encontrado: " + id));

        if (entity.getStatus() == EmployeeBenefitStatus.CANCELLED) {
            throw new BusinessException("Nao e possivel alterar um beneficio cancelado");
        }

        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.of(9999, 12, 31);
        if (employeeBenefitRepository.existsOverlappingBenefitExcluding(
                tenantId, request.getEmployeeId(), request.getBenefitTypeId(),
                request.getStartDate(), endDate, id)) {
            throw new BusinessException("O periodo informado conflita com outro beneficio ativo do mesmo tipo");
        }

        BigDecimal oldValue = entity.getFixedValue();
        BigDecimal oldPercentage = entity.getPercentage();
        String oldStatus = entity.getStatus().name();

        entity.setFixedValue(request.getFixedValue());
        entity.setPercentage(request.getPercentage());
        entity.setStartDate(request.getStartDate());
        entity.setEndDate(request.getEndDate());
        entity.setNotes(request.getNotes());
        entity.setEmployeeName(request.getEmployeeName());

        EmployeeBenefit saved = employeeBenefitRepository.save(entity);

        recordHistory(saved, "UPDATED", oldValue, saved.getFixedValue(),
                oldPercentage, saved.getPercentage(), oldStatus, saved.getStatus().name(),
                "Beneficio atualizado");

        return employeeBenefitMapper.toResponse(saved);
    }

    @Transactional
    public EmployeeBenefitResponse activate(UUID id) {
        UUID tenantId = getTenantId();
        EmployeeBenefit entity = employeeBenefitRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficio do colaborador nao encontrado: " + id));

        if (entity.getStatus() == EmployeeBenefitStatus.ACTIVE) {
            throw new BusinessException("O beneficio ja esta ativo");
        }

        String oldStatus = entity.getStatus().name();
        entity.setStatus(EmployeeBenefitStatus.ACTIVE);
        EmployeeBenefit saved = employeeBenefitRepository.save(entity);

        recordHistory(saved, "ACTIVATED", null, null, null, null,
                oldStatus, EmployeeBenefitStatus.ACTIVE.name(), "Beneficio ativado");

        log.info("Beneficio {} ativado para colaborador {}", id, entity.getEmployeeId());
        return employeeBenefitMapper.toResponse(saved);
    }

    @Transactional
    public EmployeeBenefitResponse deactivate(UUID id) {
        UUID tenantId = getTenantId();
        EmployeeBenefit entity = employeeBenefitRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficio do colaborador nao encontrado: " + id));

        if (entity.getStatus() == EmployeeBenefitStatus.INACTIVE) {
            throw new BusinessException("O beneficio ja esta inativo");
        }

        String oldStatus = entity.getStatus().name();
        entity.setStatus(EmployeeBenefitStatus.INACTIVE);
        EmployeeBenefit saved = employeeBenefitRepository.save(entity);

        recordHistory(saved, "DEACTIVATED", null, null, null, null,
                oldStatus, EmployeeBenefitStatus.INACTIVE.name(), "Beneficio desativado");

        log.info("Beneficio {} desativado para colaborador {}", id, entity.getEmployeeId());
        return employeeBenefitMapper.toResponse(saved);
    }

    @Transactional
    public EmployeeBenefitResponse cancel(UUID id) {
        UUID tenantId = getTenantId();
        EmployeeBenefit entity = employeeBenefitRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficio do colaborador nao encontrado: " + id));

        if (entity.getStatus() == EmployeeBenefitStatus.CANCELLED) {
            throw new BusinessException("O beneficio ja esta cancelado");
        }

        String oldStatus = entity.getStatus().name();
        entity.setStatus(EmployeeBenefitStatus.CANCELLED);
        entity.setEndDate(LocalDate.now());
        EmployeeBenefit saved = employeeBenefitRepository.save(entity);

        recordHistory(saved, "CANCELLED", null, null, null, null,
                oldStatus, EmployeeBenefitStatus.CANCELLED.name(), "Beneficio cancelado");

        log.info("Beneficio {} cancelado para colaborador {}", id, entity.getEmployeeId());
        return employeeBenefitMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public EmployeeBenefitResponse findById(UUID id) {
        UUID tenantId = getTenantId();
        EmployeeBenefit entity = employeeBenefitRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficio do colaborador nao encontrado: " + id));
        return employeeBenefitMapper.toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<EmployeeBenefitResponse> findByEmployee(UUID employeeId) {
        UUID tenantId = getTenantId();
        return employeeBenefitRepository.findByTenantIdAndEmployeeId(tenantId, employeeId)
                .stream()
                .map(employeeBenefitMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeBenefitResponse> findActiveByEmployee(UUID employeeId) {
        UUID tenantId = getTenantId();
        return employeeBenefitRepository.findByTenantIdAndEmployeeIdAndStatus(
                        tenantId, employeeId, EmployeeBenefitStatus.ACTIVE)
                .stream()
                .map(employeeBenefitMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<EmployeeBenefitResponse> findAll(Pageable pageable) {
        UUID tenantId = getTenantId();
        return employeeBenefitRepository.findByTenantId(tenantId, pageable)
                .map(employeeBenefitMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public EmployeeBenefitCalculationResponse calculateBenefitsForPayroll(
            UUID employeeId, Integer month, Integer year, BigDecimal baseSalary) {
        UUID tenantId = getTenantId();
        LocalDate referenceDate = LocalDate.of(year, month, 1);

        log.info("Calculando beneficios para colaborador {} referente a {}/{}", employeeId, month, year);

        List<EmployeeBenefit> activeBenefits = employeeBenefitRepository
                .findActiveByEmployeeAndDate(tenantId, employeeId, referenceDate);

        BigDecimal totalEarnings = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;
        List<EmployeeBenefitCalculationResponse.BenefitItem> items = new ArrayList<>();

        for (EmployeeBenefit eb : activeBenefits) {
            BenefitType type = eb.getBenefitType();
            BigDecimal calculatedAmount;

            if (type.getCalculationType() == CalculationType.SALARY_PERCENTAGE) {
                BigDecimal pct = eb.getPercentage() != null ? eb.getPercentage() : type.getDefaultPercentage();
                calculatedAmount = baseSalary.multiply(pct).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            } else {
                calculatedAmount = eb.getFixedValue() != null ? eb.getFixedValue() : type.getDefaultValue();
            }

            if (calculatedAmount == null) {
                calculatedAmount = BigDecimal.ZERO;
            }

            if (type.getCategory() == BenefitCategory.EARNING) {
                totalEarnings = totalEarnings.add(calculatedAmount);
            } else {
                totalDeductions = totalDeductions.add(calculatedAmount);
            }

            items.add(EmployeeBenefitCalculationResponse.BenefitItem.builder()
                    .benefitTypeId(type.getId())
                    .benefitTypeName(type.getName())
                    .category(type.getCategory())
                    .calculationType(type.getCalculationType())
                    .fixedValue(eb.getFixedValue())
                    .percentage(eb.getPercentage())
                    .calculatedAmount(calculatedAmount)
                    .build());
        }

        String employeeName = activeBenefits.isEmpty() ? null : activeBenefits.get(0).getEmployeeName();

        return EmployeeBenefitCalculationResponse.builder()
                .employeeId(employeeId)
                .employeeName(employeeName)
                .referenceMonth(month)
                .referenceYear(year)
                .totalEarnings(totalEarnings)
                .totalDeductions(totalDeductions)
                .items(items)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<BenefitHistoryResponse> getHistory(UUID employeeId, Pageable pageable) {
        UUID tenantId = getTenantId();
        return benefitHistoryRepository
                .findByTenantIdAndEmployeeIdOrderByChangedAtDesc(tenantId, employeeId, pageable)
                .map(benefitHistoryMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<BenefitHistoryResponse> getBenefitHistory(UUID employeeBenefitId) {
        UUID tenantId = getTenantId();
        return benefitHistoryRepository
                .findByTenantIdAndEmployeeBenefitIdOrderByChangedAtDesc(tenantId, employeeBenefitId)
                .stream()
                .map(benefitHistoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    private EmployeeBenefitStatus determineInitialStatus(LocalDate startDate) {
        if (startDate.isAfter(LocalDate.now())) {
            return EmployeeBenefitStatus.SCHEDULED;
        }
        return EmployeeBenefitStatus.ACTIVE;
    }

    private void recordHistory(EmployeeBenefit benefit, String action,
                               BigDecimal oldValue, BigDecimal newValue,
                               BigDecimal oldPercentage, BigDecimal newPercentage,
                               String oldStatus, String newStatus, String notes) {
        BenefitHistory history = BenefitHistory.builder()
                .tenantId(benefit.getTenantId())
                .employeeId(benefit.getEmployeeId())
                .employeeBenefitId(benefit.getId())
                .benefitTypeName(benefit.getBenefitType().getName())
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .oldPercentage(oldPercentage)
                .newPercentage(newPercentage)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .notes(notes)
                .build();

        benefitHistoryRepository.save(history);
    }
}
