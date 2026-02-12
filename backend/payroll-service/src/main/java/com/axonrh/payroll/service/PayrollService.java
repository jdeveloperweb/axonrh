package com.axonrh.payroll.service;

import com.axonrh.payroll.client.EmployeeServiceClient;
import com.axonrh.payroll.client.PerformanceServiceClient;
import com.axonrh.payroll.client.TimesheetServiceClient;
import com.axonrh.payroll.client.VacationServiceClient;
import com.axonrh.payroll.config.TenantContext;
import com.axonrh.payroll.dto.*;
import com.axonrh.payroll.entity.Payroll;
import com.axonrh.payroll.entity.PayrollRun;
import com.axonrh.payroll.enums.PayrollItemType;
import com.axonrh.payroll.enums.PayrollRunStatus;
import com.axonrh.payroll.enums.PayrollStatus;
import com.axonrh.payroll.exception.BusinessException;
import com.axonrh.payroll.exception.ResourceNotFoundException;
import com.axonrh.payroll.mapper.PayrollMapper;
import com.axonrh.payroll.repository.PayrollRepository;
import com.axonrh.payroll.repository.PayrollRunRepository;
import com.axonrh.kafka.event.DomainEvent;
import com.axonrh.kafka.producer.DomainEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final PayrollRunRepository payrollRunRepository;
    private final PayrollCalculationEngine calculationEngine;
    private final PayrollMapper payrollMapper;
    private final EmployeeServiceClient employeeServiceClient;
    private final TimesheetServiceClient timesheetServiceClient;
    private final VacationServiceClient vacationServiceClient;
    private final PerformanceServiceClient performanceServiceClient;
    private final DomainEventPublisher eventPublisher;

    /**
     * Processa folha de pagamento individual.
     *
     */
    @Transactional
    @CacheEvict(value = "payrolls", allEntries = true)
    public PayrollResponse processPayroll(PayrollRequest request) {
        UUID tenantId = getTenantId();
        log.info("Processando folha individual - Colaborador: {}, Competencia: {}/{}",
                request.getEmployeeId(), request.getReferenceMonth(), request.getReferenceYear());

        // Verifica se ja existe folha fechada para este periodo
        if (payrollRunRepository.existsByTenantIdAndReferenceMonthAndReferenceYearAndStatus(
                tenantId, request.getReferenceMonth(), request.getReferenceYear(), PayrollRunStatus.CLOSED)) {
            throw new BusinessException("Competencia " + request.getReferenceMonth() + "/" +
                    request.getReferenceYear() + " ja esta fechada. Nao e possivel reprocessar.");
        }

        // Coleta dados dos servicos
        EmployeeDTO employee = employeeServiceClient.getEmployee(request.getEmployeeId());
        TimesheetDTO timesheet = fetchTimesheet(request.getEmployeeId(), request.getReferenceMonth(), request.getReferenceYear());
        List<VacationDTO> vacations = fetchVacations(request.getEmployeeId(), request.getReferenceMonth(), request.getReferenceYear());
        PerformanceBonusDTO bonus = fetchBonus(request.getEmployeeId(), request.getReferenceMonth(), request.getReferenceYear());

        // Verifica se ja existe folha para este colaborador/periodo
        Payroll existing = payrollRepository
                .findByTenantIdAndEmployeeIdAndReferenceMonthAndReferenceYear(
                        tenantId, request.getEmployeeId(), request.getReferenceMonth(), request.getReferenceYear())
                .orElse(null);

        if (existing != null && existing.getStatus() == PayrollStatus.CLOSED) {
            throw new BusinessException("Folha ja fechada para este colaborador nesta competencia.");
        }

        // Se existe e nao esta fechada, reprocessa (incrementa versao)
        if (existing != null) {
            log.info("Reprocessando folha existente (versao {}) para {}", existing.getCalculationVersion(), employee.getFullName());
            payrollRepository.delete(existing);
            payrollRepository.flush();
        }

        // Calcula nova folha
        Payroll payroll = calculationEngine.calculate(
                tenantId, employee, timesheet, vacations, bonus,
                request.getReferenceMonth(), request.getReferenceYear());

        if (existing != null) {
            payroll.setCalculationVersion(existing.getCalculationVersion() + 1);
            payroll.setStatus(PayrollStatus.RECALCULATED);
        }

        Payroll saved = payrollRepository.save(payroll);
        log.info("Folha salva com sucesso - ID: {}, Liquido: {}", saved.getId(), saved.getNetSalary());

        return payrollMapper.toResponse(saved);
    }

    /**
     * Processa folha em lote para todos os colaboradores ativos.
     */
    @Transactional
    @CacheEvict(value = "payrolls", allEntries = true)
    public PayrollRunResponse processBatch(PayrollBatchRequest request) {
        UUID tenantId = getTenantId();
        log.info("Iniciando processamento em lote - Competencia: {}/{}", request.getReferenceMonth(), request.getReferenceYear());

        if (payrollRunRepository.existsByTenantIdAndReferenceMonthAndReferenceYearAndStatus(
                tenantId, request.getReferenceMonth(), request.getReferenceYear(), PayrollRunStatus.CLOSED)) {
            throw new BusinessException("Competencia ja fechada.");
        }

        // Cria o run
        PayrollRun run = PayrollRun.builder()
                .tenantId(tenantId)
                .referenceMonth(request.getReferenceMonth())
                .referenceYear(request.getReferenceYear())
                .description(request.getDescription() != null ? request.getDescription()
                        : "Folha " + String.format("%02d/%d", request.getReferenceMonth(), request.getReferenceYear()))
                .status(PayrollRunStatus.PROCESSING)
                .startedAt(LocalDateTime.now())
                .build();

        run = payrollRunRepository.save(run);

        // Busca colaboradores
        List<EmployeeDTO> employees;
        if (request.getEmployeeIds() != null && !request.getEmployeeIds().isEmpty()) {
            employees = new ArrayList<>();
            for (UUID empId : request.getEmployeeIds()) {
                try {
                    employees.add(employeeServiceClient.getEmployee(empId));
                } catch (Exception e) {
                    log.error("Erro ao buscar colaborador {}: {}", empId, e.getMessage());
                }
            }
        } else if (request.getDepartmentIds() != null && !request.getDepartmentIds().isEmpty()) {
            employees = new ArrayList<>();
            for (UUID deptId : request.getDepartmentIds()) {
                try {
                    List<EmployeeDTO> deptEmployees = employeeServiceClient.getActiveEmployees("ACTIVE", deptId);
                    if (deptEmployees != null) {
                        employees.addAll(deptEmployees);
                    }
                } catch (Exception e) {
                    log.error("Erro ao buscar colaboradores do departamento {}: {}", deptId, e.getMessage());
                }
            }
            // Distinct por ID
            employees = employees.stream()
                    .filter(e -> e.getId() != null)
                    .collect(Collectors.toMap(EmployeeDTO::getId, e -> e, (e1, e2) -> e1))
                    .values().stream().toList();
        } else {
            employees = employeeServiceClient.getActiveEmployees("ACTIVE", null);
        }

        int failedCount = 0;

        for (EmployeeDTO employee : employees) {
            try {
                TimesheetDTO timesheet = fetchTimesheet(employee.getId(), request.getReferenceMonth(), request.getReferenceYear());
                List<VacationDTO> vacations = fetchVacations(employee.getId(), request.getReferenceMonth(), request.getReferenceYear());
                PerformanceBonusDTO bonus = fetchBonus(employee.getId(), request.getReferenceMonth(), request.getReferenceYear());

                // Remove folha anterior se existir (exceto fechadas)
                payrollRepository.findByTenantIdAndEmployeeIdAndReferenceMonthAndReferenceYear(
                        tenantId, employee.getId(), request.getReferenceMonth(), request.getReferenceYear())
                        .ifPresent(existing -> {
                            if (existing.getStatus() != PayrollStatus.CLOSED) {
                                payrollRepository.delete(existing);
                            }
                        });

                Payroll payroll = calculationEngine.calculate(
                        tenantId, employee, timesheet, vacations, bonus,
                        request.getReferenceMonth(), request.getReferenceYear());

                payroll.setPayrollRun(run);
                payrollRepository.save(payroll);
                run.getPayrolls().add(payroll);

            } catch (Exception e) {
                log.error("Erro ao processar folha do colaborador {} ({}): {}",
                        employee.getFullName(), employee.getId(), e.getMessage());
                failedCount++;
            }
        }

        // Atualiza o run
        run.setFailedEmployees(failedCount);
        run.setStatus(PayrollRunStatus.PROCESSED);
        run.setFinishedAt(LocalDateTime.now());
        run.recalculateSummary();
        payrollRunRepository.save(run);

        log.info("Processamento em lote finalizado - Total: {}, Processados: {}, Falhas: {}",
                employees.size(), run.getProcessedEmployees(), failedCount);

        return payrollMapper.toRunResponse(run);
    }

    /**
     * Gera demonstrativo (holerite) de um colaborador.
     */
    @Transactional(readOnly = true)
    public PayslipResponse generatePayslip(UUID payrollId) {
        UUID tenantId = getTenantId();

        Payroll payroll = payrollRepository.findByIdWithItems(tenantId, payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Folha nao encontrada: " + payrollId));

        List<PayrollItemResponse> earnings = payroll.getItems().stream()
                .filter(i -> i.getType() == PayrollItemType.EARNING)
                .map(payrollMapper::toItemResponse)
                .collect(Collectors.toList());

        List<PayrollItemResponse> deductions = payroll.getItems().stream()
                .filter(i -> i.getType() == PayrollItemType.DEDUCTION)
                .map(payrollMapper::toItemResponse)
                .collect(Collectors.toList());

        // Busca INSS e IRRF dos itens
        var inssItem = payroll.getItems().stream()
                .filter(i -> i.getCode() == com.axonrh.payroll.enums.PayrollItemCode.INSS)
                .findFirst();
        var irrfItem = payroll.getItems().stream()
                .filter(i -> i.getCode() == com.axonrh.payroll.enums.PayrollItemCode.IRRF)
                .findFirst();

        return PayslipResponse.builder()
                .companyName("AxonRH") // TODO: Buscar do config-service
                .companyCnpj("00.000.000/0001-00")
                .employeeName(payroll.getEmployeeName())
                .employeeCpf(payroll.getEmployeeCpf())
                .department(payroll.getDepartmentName())
                .position(payroll.getPositionName())
                .referenceLabel(String.format("%02d/%d", payroll.getReferenceMonth(), payroll.getReferenceYear()))
                .baseSalary(payroll.getBaseSalary())
                .earnings(earnings)
                .deductions(deductions)
                .totalEarnings(payroll.getTotalEarnings())
                .totalDeductions(payroll.getTotalDeductions())
                .netSalary(payroll.getNetSalary())
                .fgtsBase(payroll.getTotalEarnings())
                .fgtsAmount(payroll.getFgtsAmount())
                .inssBase(inssItem.map(i -> i.getReferenceValue()).orElse(null))
                .inssAmount(inssItem.map(i -> i.getAmount()).orElse(null))
                .irrfBase(irrfItem.map(i -> i.getReferenceValue()).orElse(null))
                .irrfAmount(irrfItem.map(i -> i.getAmount()).orElse(null))
                .build();
    }

    /**
     * Fecha competencia (impede alteracoes).
     */
    @Transactional
    @CacheEvict(value = "payrolls", allEntries = true)
    public PayrollRunResponse closeCompetency(Integer month, Integer year, UUID userId) {
        UUID tenantId = getTenantId();
        log.info("Fechando competencia {}/{}", month, year);

        PayrollRun run = payrollRunRepository
                .findByTenantIdAndReferenceMonthAndReferenceYearAndStatusNot(
                        tenantId, month, year, PayrollRunStatus.CANCELLED)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Nenhum processamento encontrado para " + month + "/" + year));

        if (run.getStatus() == PayrollRunStatus.CLOSED) {
            throw new BusinessException("Competencia ja fechada.");
        }

        if (run.getStatus() != PayrollRunStatus.PROCESSED) {
            throw new BusinessException("Competencia precisa estar processada para fechar. Status atual: " + run.getStatus());
        }

        // Fecha todas as folhas do run
        for (Payroll payroll : run.getPayrolls()) {
            if (payroll.getStatus() != PayrollStatus.CANCELLED) {
                payroll.setStatus(PayrollStatus.CLOSED);
            }
        }

        run.setStatus(PayrollRunStatus.CLOSED);
        run.setClosedAt(LocalDateTime.now());
        run.setClosedBy(userId);

        payrollRunRepository.save(run);

        log.info("Competencia {}/{} fechada com sucesso", month, year);

        return payrollMapper.toRunResponse(run);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "payrolls", key = "#id")
    public PayrollResponse findById(UUID id) {
        UUID tenantId = getTenantId();
        Payroll payroll = payrollRepository.findByIdWithItems(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Folha nao encontrada: " + id));
        return payrollMapper.toResponse(payroll);
    }

    @Transactional(readOnly = true)
    public Page<PayrollResponse> findByCompetency(Integer month, Integer year, Pageable pageable) {
        UUID tenantId = getTenantId();
        return payrollRepository
                .findByTenantIdAndReferenceMonthAndReferenceYear(tenantId, month, year, pageable)
                .map(payrollMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<PayrollResponse> findByEmployee(UUID employeeId) {
        UUID tenantId = getTenantId();
        return payrollRepository
                .findByTenantIdAndEmployeeIdOrderByReferenceYearDescReferenceMonthDesc(tenantId, employeeId)
                .stream()
                .map(payrollMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PayrollRunResponse> findAllRuns(Pageable pageable) {
        UUID tenantId = getTenantId();
        return payrollRunRepository
                .findByTenantIdOrderByReferenceYearDescReferenceMonthDesc(tenantId, pageable)
                .map(payrollMapper::toRunResponse);
    }

    // === Helpers para buscar dados com fallback seguro ===

    private TimesheetDTO fetchTimesheet(UUID employeeId, Integer month, Integer year) {
        try {
            return timesheetServiceClient.getMonthSummary(employeeId, month, year);
        } catch (Exception e) {
            log.warn("Nao foi possivel obter timesheet para colaborador {}: {}", employeeId, e.getMessage());
            return TimesheetDTO.builder()
                    .regularHours(new java.math.BigDecimal("220"))
                    .overtime50Hours(java.math.BigDecimal.ZERO)
                    .overtime100Hours(java.math.BigDecimal.ZERO)
                    .nightShiftHours(java.math.BigDecimal.ZERO)
                    .absenceDays(java.math.BigDecimal.ZERO)
                    .build();
        }
    }

    private List<VacationDTO> fetchVacations(UUID employeeId, Integer month, Integer year) {
        try {
            return vacationServiceClient.getVacationsForPeriod(employeeId, month, year);
        } catch (Exception e) {
            log.warn("Nao foi possivel obter ferias para colaborador {}: {}", employeeId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private PerformanceBonusDTO fetchBonus(UUID employeeId, Integer month, Integer year) {
        try {
            return performanceServiceClient.getBonusForPeriod(employeeId, month, year);
        } catch (Exception e) {
            log.warn("Nao foi possivel obter bonus para colaborador {}: {}", employeeId, e.getMessage());
            return PerformanceBonusDTO.builder()
                    .bonusAmount(java.math.BigDecimal.ZERO)
                    .commissionAmount(java.math.BigDecimal.ZERO)
                    .build();
        }
    }

    private UUID getTenantId() {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            throw new BusinessException("Tenant ID nao informado");
        }
        return UUID.fromString(tenantStr);
    }
}
