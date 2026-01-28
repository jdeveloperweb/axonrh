package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.EmployeeRequest;
import com.axonrh.employee.dto.EmployeeResponse;
import com.axonrh.employee.entity.*;
import com.axonrh.employee.entity.enums.EmployeeStatus;
import com.axonrh.employee.exception.DuplicateResourceException;
import com.axonrh.employee.exception.InvalidCpfException;
import com.axonrh.employee.exception.ResourceNotFoundException;
import com.axonrh.employee.mapper.EmployeeMapper;
import com.axonrh.employee.repository.*;
import com.axonrh.kafka.event.employee.EmployeeCreatedEvent;
import com.axonrh.kafka.event.employee.EmployeeTerminatedEvent;
import com.axonrh.kafka.event.employee.EmployeeUpdatedEvent;
import com.axonrh.kafka.producer.DomainEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * T103 - Servico de CRUD de colaboradores.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final CostCenterRepository costCenterRepository;
    private final EmployeeHistoryRepository historyRepository;
    private final EmployeeMapper employeeMapper;
    private final CpfValidator cpfValidator;
    private final DomainEventPublisher eventPublisher;

    /**
     * Lista colaboradores com paginacao.
     */
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> findAll(Pageable pageable) {
        UUID tenantId = getTenantId();
        log.debug("Listando colaboradores - tenant: {}", tenantId);

        return employeeRepository.findByTenantIdAndIsActiveTrue(tenantId, pageable)
                .map(employeeMapper::toResponse);
    }

    /**
     * Lista colaboradores por status.
     */
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> findByStatus(EmployeeStatus status, Pageable pageable) {
        UUID tenantId = getTenantId();
        return employeeRepository.findByTenantIdAndStatus(tenantId, status, pageable)
                .map(employeeMapper::toResponse);
    }

    /**
     * Busca colaborador por ID.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "employees", key = "#id")
    public EmployeeResponse findById(UUID id) {
        UUID tenantId = getTenantId();
        log.debug("Buscando colaborador: {} - tenant: {}", id, tenantId);

        Employee employee = employeeRepository.findByIdWithRelations(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador nao encontrado: " + id));

        return employeeMapper.toResponse(employee);
    }

    /**
     * Busca colaborador por CPF.
     */
    @Transactional(readOnly = true)
    public EmployeeResponse findByCpf(String cpf) {
        UUID tenantId = getTenantId();
        String cleanCpf = cpfValidator.unformat(cpf);

        Employee employee = employeeRepository.findByTenantIdAndCpf(tenantId, cleanCpf)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador nao encontrado com CPF: " + cpf));

        return employeeMapper.toResponse(employee);
    }

    /**
     * Verifica se um CPF ja esta cadastrado.
     */
    @Transactional(readOnly = true)
    public boolean existsByCpf(String cpf) {
        UUID tenantId = getTenantId();
        String cleanCpf = cpfValidator.unformat(cpf);
        return employeeRepository.existsByTenantIdAndCpf(tenantId, cleanCpf);
    }

    /**
     * Pesquisa colaboradores por nome.
     */
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> searchByName(String name, Pageable pageable) {
        UUID tenantId = getTenantId();
        return employeeRepository.searchByName(tenantId, name, pageable)
                .map(employeeMapper::toResponse);
    }

    /**
     * Cria novo colaborador.
     */
    @Transactional
    @CacheEvict(value = "employees", allEntries = true)
    public EmployeeResponse create(EmployeeRequest request, UUID userId) {
        UUID tenantId = getTenantId();
        log.info("Criando colaborador: {} - tenant: {}", request.getFullName(), tenantId);

        // Valida CPF
        String cpf = cpfValidator.unformat(request.getCpf());
        if (!cpfValidator.isValid(cpf)) {
            throw new InvalidCpfException("CPF invalido: " + request.getCpf());
        }

        // Verifica duplicidade
        if (employeeRepository.existsByTenantIdAndCpf(tenantId, cpf)) {
            throw new DuplicateResourceException("Ja existe colaborador com este CPF");
        }
        if (employeeRepository.existsByTenantIdAndEmail(tenantId, request.getEmail())) {
            throw new DuplicateResourceException("Ja existe colaborador com este email");
        }

        // Mapeia e salva
        Employee employee = employeeMapper.toEntity(request);
        employee.setTenantId(tenantId);
        employee.setCpf(cpf);
        employee.setCreatedBy(userId);

        // Carrega relacionamentos
        loadRelationships(employee, request);

        Employee saved = employeeRepository.save(employee);

        // Registra historico
        saveHistory(saved, "CREATE", null, null, "Colaborador criado", userId);

        // Publica evento
        publishCreatedEvent(saved);

        log.info("Colaborador criado: {} - ID: {}", saved.getFullName(), saved.getId());
        return employeeMapper.toResponse(saved);
    }

    /**
     * Atualiza colaborador existente.
     */
    @Transactional
    @CacheEvict(value = "employees", key = "#id")
    public EmployeeResponse update(UUID id, EmployeeRequest request, UUID userId) {
        UUID tenantId = getTenantId();
        log.info("Atualizando colaborador: {} - tenant: {}", id, tenantId);

        Employee employee = employeeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador nao encontrado: " + id));

        // Captura valores antigos para historico
        Map<String, Object> oldValues = captureCurrentValues(employee);

        // Valida CPF se alterado
        String newCpf = cpfValidator.unformat(request.getCpf());
        if (!employee.getCpf().equals(newCpf)) {
            if (!cpfValidator.isValid(newCpf)) {
                throw new InvalidCpfException("CPF invalido: " + request.getCpf());
            }
            if (employeeRepository.existsByTenantIdAndCpf(tenantId, newCpf)) {
                throw new DuplicateResourceException("Ja existe colaborador com este CPF");
            }
        }

        // Valida email se alterado
        if (!employee.getEmail().equals(request.getEmail())) {
            if (employeeRepository.existsByTenantIdAndEmail(tenantId, request.getEmail())) {
                throw new DuplicateResourceException("Ja existe colaborador com este email");
            }
        }

        // Atualiza campos
        employeeMapper.updateEntity(employee, request);
        employee.setCpf(newCpf);
        employee.setUpdatedBy(userId);

        // Carrega relacionamentos
        loadRelationships(employee, request);

        Employee saved = employeeRepository.save(employee);

        // Registra historico com diferencas
        Map<String, Object> newValues = captureCurrentValues(saved);
        Map<String, Object> changes = findChanges(oldValues, newValues);
        if (!changes.isEmpty()) {
            saveHistory(saved, "UPDATE", oldValues.toString(), newValues.toString(), null, userId);
            publishUpdatedEvent(saved, changes, newValues);
        }

        log.info("Colaborador atualizado: {}", saved.getId());
        return employeeMapper.toResponse(saved);
    }

    /**
     * Desativa colaborador (soft delete).
     */
    @Transactional
    @CacheEvict(value = "employees", key = "#id")
    public void deactivate(UUID id, UUID userId) {
        UUID tenantId = getTenantId();
        log.info("Desativando colaborador: {} - tenant: {}", id, tenantId);

        Employee employee = employeeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador nao encontrado: " + id));

        employee.setIsActive(false);
        employee.setStatus(EmployeeStatus.INACTIVE);
        employee.setUpdatedBy(userId);

        employeeRepository.save(employee);
        saveHistory(employee, "DEACTIVATE", "true", "false", "Colaborador desativado", userId);

        log.info("Colaborador desativado: {}", id);
    }

    /**
     * Efetua desligamento do colaborador.
     */
    @Transactional
    @CacheEvict(value = "employees", key = "#id")
    public EmployeeResponse terminate(UUID id, LocalDate terminationDate, String reason, UUID userId) {
        UUID tenantId = getTenantId();
        log.info("Desligando colaborador: {} - data: {}", id, terminationDate);

        Employee employee = employeeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador nao encontrado: " + id));

        employee.terminate(terminationDate);
        employee.setUpdatedBy(userId);

        Employee saved = employeeRepository.save(employee);
        saveHistory(saved, "TERMINATION", null, terminationDate.toString(), reason, userId);
        publishTerminatedEvent(saved, terminationDate, reason);

        log.info("Colaborador desligado: {} - data: {}", id, terminationDate);
        return employeeMapper.toResponse(saved);
    }

    /**
     * Conta colaboradores ativos.
     */
    @Transactional(readOnly = true)
    public long countActive() {
        return employeeRepository.countByTenantIdAndIsActiveTrue(getTenantId());
    }

    // ==================== Metodos Privados ====================

    private UUID getTenantId() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null) {
            throw new IllegalStateException("Tenant nao definido no contexto");
        }
        return UUID.fromString(tenant);
    }

    private void loadRelationships(Employee employee, EmployeeRequest request) {
        UUID tenantId = employee.getTenantId();

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findByTenantIdAndId(tenantId, request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Departamento nao encontrado"));
            employee.setDepartment(dept);
        }

        if (request.getPositionId() != null) {
            Position pos = positionRepository.findByTenantIdAndId(tenantId, request.getPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cargo nao encontrado"));
            employee.setPosition(pos);
        }

        if (request.getCostCenterId() != null) {
            CostCenter cc = costCenterRepository.findByTenantIdAndId(tenantId, request.getCostCenterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Centro de custo nao encontrado"));
            employee.setCostCenter(cc);
        }

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findByTenantIdAndId(tenantId, request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Gestor nao encontrado"));
            employee.setManager(manager);
        }
    }

    private void saveHistory(Employee employee, String changeType, String oldValue,
                             String newValue, String reason, UUID userId) {
        EmployeeHistory history = EmployeeHistory.builder()
                .tenantId(employee.getTenantId())
                .employeeId(employee.getId())
                .changeType(changeType)
                .oldValue(oldValue)
                .newValue(newValue)
                .changeReason(reason)
                .effectiveDate(LocalDate.now())
                .changedBy(userId)
                .build();

        historyRepository.save(history);
    }

    private Map<String, Object> captureCurrentValues(Employee employee) {
        Map<String, Object> values = new HashMap<>();
        values.put("fullName", employee.getFullName());
        values.put("email", employee.getEmail());
        values.put("departmentId", employee.getDepartment() != null ? employee.getDepartment().getId() : null);
        values.put("positionId", employee.getPosition() != null ? employee.getPosition().getId() : null);
        values.put("baseSalary", employee.getBaseSalary());
        values.put("status", employee.getStatus());
        return values;
    }

    private Map<String, Object> findChanges(Map<String, Object> oldValues, Map<String, Object> newValues) {
        Map<String, Object> changes = new HashMap<>();
        for (String key : oldValues.keySet()) {
            Object oldVal = oldValues.get(key);
            Object newVal = newValues.get(key);
            if (oldVal == null && newVal != null || oldVal != null && !oldVal.equals(newVal)) {
                changes.put(key, oldVal);
            }
        }
        return changes;
    }

    private void publishCreatedEvent(Employee employee) {
        try {
            EmployeeCreatedEvent event = EmployeeCreatedEvent.create()
                    .eventId(UUID.randomUUID())
                    .tenantId(employee.getTenantId())
                    .aggregateId(employee.getId())
                    .cpf(employee.getCpf())
                    .fullName(employee.getFullName())
                    .email(employee.getEmail())
                    .birthDate(employee.getBirthDate())
                    .hireDate(employee.getHireDate())
                    .departmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null)
                    .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                    .positionId(employee.getPosition() != null ? employee.getPosition().getId() : null)
                    .positionName(employee.getPosition() != null ? employee.getPosition().getTitle() : null)
                    .employmentType(employee.getEmploymentType().name())
                    .build();

            eventPublisher.publish(event);
        } catch (Exception e) {
            log.error("Erro ao publicar evento de criacao: {}", e.getMessage());
        }
    }

    private void publishUpdatedEvent(Employee employee, Map<String, Object> oldValues, Map<String, Object> newValues) {
        try {
            EmployeeUpdatedEvent event = EmployeeUpdatedEvent.create()
                    .eventId(UUID.randomUUID())
                    .tenantId(employee.getTenantId())
                    .aggregateId(employee.getId())
                    .changedFields(oldValues)
                    .newValues(newValues)
                    .build();

            eventPublisher.publish(event);
        } catch (Exception e) {
            log.error("Erro ao publicar evento de atualizacao: {}", e.getMessage());
        }
    }

    private void publishTerminatedEvent(Employee employee, LocalDate terminationDate, String reason) {
        try {
            EmployeeTerminatedEvent event = EmployeeTerminatedEvent.create()
                    .eventId(UUID.randomUUID())
                    .tenantId(employee.getTenantId())
                    .aggregateId(employee.getId())
                    .terminationDate(terminationDate)
                    .terminationReason(reason)
                    .build();

            eventPublisher.publish(event);
        } catch (Exception e) {
            log.error("Erro ao publicar evento de desligamento: {}", e.getMessage());
        }
    }
}
