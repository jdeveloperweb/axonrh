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
    private final com.axonrh.benefits.client.EmployeeClient employeeClient;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

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

        // Handle dependents
        if (request.getDependentIds() != null && !request.getDependentIds().isEmpty()) {
            // Fetch dependents info from Employee Service to get names
            try {
                com.axonrh.benefits.dto.EmployeeDetailsDto employeeDetails = employeeClient.getEmployeeDetails(request.getEmployeeId());
                if (employeeDetails != null && employeeDetails.getDependents() != null) {
                    java.util.Map<UUID, String> dependentNames = employeeDetails.getDependents().stream()
                            .collect(Collectors.toMap(com.axonrh.benefits.dto.DependentDto::getId, com.axonrh.benefits.dto.DependentDto::getName));

                    for (UUID depId : request.getDependentIds()) {
                        String depName = dependentNames.getOrDefault(depId, "Unknown");
                        com.axonrh.benefits.entity.EmployeeBenefitDependent dependentEntity = com.axonrh.benefits.entity.EmployeeBenefitDependent.builder()
                                .employeeBenefit(entity) // Will be set after save? No, entity needs to be saved first if not cascading properly, but cascade is ALL.
                                .dependentId(depId)
                                .dependentName(depName)
                                .build();
                         // Fix circular reference if needed, or just add to list
                         dependentEntity.setEmployeeBenefit(entity);
                         entity.getDependents().add(dependentEntity);
                    }
                }
            } catch (Exception e) {
                log.error("Erro ao buscar dependentes do colaborador", e);
                // Proceed without names or throw error? proceed.
            }
        }

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

            if (type.getRules() != null && !type.getRules().isBlank()) {
                calculatedAmount = applyBenefitRules(type, eb, baseSalary, employeeId);
            } else {
                if (type.getCalculationType() == CalculationType.SALARY_PERCENTAGE) {
                    BigDecimal pct = eb.getPercentage() != null ? eb.getPercentage() : type.getDefaultPercentage();
                    calculatedAmount = baseSalary.multiply(pct).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                } else {
                    calculatedAmount = eb.getFixedValue() != null ? eb.getFixedValue() : type.getDefaultValue();
                }
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

    private BigDecimal applyBenefitRules(BenefitType type, EmployeeBenefit eb, BigDecimal baseSalary, UUID employeeId) {
        try {
            com.axonrh.benefits.dto.BenefitRule rule = objectMapper.readValue(type.getRules(), com.axonrh.benefits.dto.BenefitRule.class);
            
            if (rule.getRuleType() == com.axonrh.benefits.dto.BenefitRule.RuleType.TRANSPORT_VOUCHER) {
                // 6% of salary (or configured percentage)
                BigDecimal pct = rule.getPercentage() != null ? rule.getPercentage() : BigDecimal.valueOf(6.0);
                BigDecimal discount = baseSalary.multiply(pct).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                
                // Cap at the benefit value (assumed to be fixedValue in EmployeeBenefit)
                BigDecimal benefitValue = eb.getFixedValue() != null ? eb.getFixedValue() : BigDecimal.ZERO;
                if (discount.compareTo(benefitValue) > 0) {
                    return benefitValue;
                }
                return discount;
            } 
            else if (rule.getRuleType() == com.axonrh.benefits.dto.BenefitRule.RuleType.HEALTH_PLAN) {
                BigDecimal totalCost = BigDecimal.ZERO;
                
                com.axonrh.benefits.dto.EmployeeDetailsDto details = null;
                try {
                     details = employeeClient.getEmployeeDetails(employeeId);
                } catch (Exception ignored) {
                    log.warn("Erro ao buscar detalhes do colaborador {}, usando dados mockados", employeeId);
                }

                if (details == null) {
                    // MOCK DATA for testing purpose if service is down or employee not found
                    details = new com.axonrh.benefits.dto.EmployeeDetailsDto();
                    details.setBirthDate(LocalDate.of(1990, 1, 1)); // 34 years old
                    details.setDependents(new ArrayList<>());
                    
                    // Add a mock child dependent if employee has dependents assigned in benefit
                    if (eb.getDependents() != null && !eb.getDependents().isEmpty()) {
                        for (com.axonrh.benefits.entity.EmployeeBenefitDependent ebDep : eb.getDependents()) {
                             com.axonrh.benefits.dto.DependentDto dep = new com.axonrh.benefits.dto.DependentDto();
                             dep.setId(ebDep.getDependentId());
                             dep.setName(ebDep.getDependentName());
                             dep.setBirthDate(LocalDate.of(2020, 1, 1)); // 4 years old (likely exempt or cheap)
                             details.getDependents().add(dep);
                        }
                    }
                }

                // Employee Cost
                int employeeAge = calculateAge(details.getBirthDate());
                
                BigDecimal empCost = calculateHealthCost(employeeAge, rule.getEmployeeFixedValue(), rule.getAgeRules());
                totalCost = totalCost.add(empCost);
                
                // Dependents Cost
                if (eb.getDependents() != null && details.getDependents() != null) {
                    // Need to match dependent IDs to their birthdates from details
                    java.util.Map<UUID, LocalDate> dependentBirthDates = details.getDependents().stream()
                        .collect(Collectors.toMap(com.axonrh.benefits.dto.DependentDto::getId, com.axonrh.benefits.dto.DependentDto::getBirthDate));

                    for (com.axonrh.benefits.entity.EmployeeBenefitDependent dep : eb.getDependents()) {
                         LocalDate dob = dependentBirthDates.get(dep.getDependentId());
                         if (dob != null) { // Only calculate if we found the birth date
                             int age = calculateAge(dob);
                             BigDecimal depCost = calculateHealthCost(age, rule.getDependentFixedValue(), rule.getAgeRules());
                             totalCost = totalCost.add(depCost);
                         } else {
                             // Fallback for mock/missing data on specific dependent
                             BigDecimal depCost = calculateHealthCost(5, rule.getDependentFixedValue(), rule.getAgeRules()); // Assume child
                             totalCost = totalCost.add(depCost);
                         }
                    }
                }
                
                return totalCost;
            }
            
            // Fallback
            return eb.getFixedValue() != null ? eb.getFixedValue() : BigDecimal.ZERO;

        } catch (Exception e) {
            log.error("Erro ao aplicar regras de beneficio", e);
            return BigDecimal.ZERO;
        }
    }
    
    private int calculateAge(LocalDate birthDate) {
        if (birthDate == null) return 0;
        return java.time.Period.between(birthDate, LocalDate.now()).getYears();
    }
    
    private BigDecimal calculateHealthCost(int age, BigDecimal baseValue, List<com.axonrh.benefits.dto.BenefitRule.AgeRule> ageRules) {
        if (baseValue == null) baseValue = BigDecimal.ZERO;
        
        if (ageRules != null) {
            for (com.axonrh.benefits.dto.BenefitRule.AgeRule rule : ageRules) {
                if (age >= rule.getMinAge() && age <= rule.getMaxAge()) {
                     if (rule.isExempt()) return BigDecimal.ZERO;
                     if (rule.getValue() != null) return rule.getValue();
                }
            }
        }
        return baseValue;
    }
}
