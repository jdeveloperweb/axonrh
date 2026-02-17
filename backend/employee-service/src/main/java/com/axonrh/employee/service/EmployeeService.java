package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.EmployeeDependentRequest;
import com.axonrh.employee.dto.EmployeeRequest;
import com.axonrh.employee.dto.EmployeeResponse;
import com.axonrh.employee.dto.EmployeeStatsResponse;
import com.axonrh.employee.entity.*;
import com.axonrh.employee.entity.enums.EmployeeStatus;
import com.axonrh.employee.entity.enums.WorkRegime;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    private final FileStorageService fileStorageService;
    private final EmployeeDependentRepository dependentRepository;

    /**
     * Lista colaboradores com paginacao.
     */
    /**
     * Lista colaboradores com filtros dinamicos.
     */
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getActiveEmployees(UUID departmentId) {
        UUID tenantId = getTenantId();
        org.springframework.data.jpa.domain.Specification<Employee> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));
            predicates.add(cb.equal(root.get("status"), EmployeeStatus.ACTIVE));
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return employeeRepository.findAll(spec).stream()
                .map(employeeMapper::toResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<EmployeeResponse> findWithFilters(String search, EmployeeStatus status, UUID departmentId, UUID positionId, WorkRegime workRegime, String hybridDay, Pageable pageable) {
        UUID tenantId = getTenantId();
        log.info(">>> [DEBUG-TRACE] EmployeeService.findWithFilters - Search: {}, Status: {}, Dept: {}, Pos: {}, Regime: {}, Day: {}", 
                search, status, departmentId, positionId, workRegime, hybridDay);

        org.springframework.data.jpa.domain.Specification<Employee> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

            predicates.add(cb.equal(root.get("tenantId"), tenantId));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));

            }
            
            // Removido filtro padrao isActive=true para permitir que "Todos" (status=null) retorne
            // realmente todos os colaboradores, inclusive inativos/desligados.
            // O Frontend deve enviar status=ACTIVE explicitamente para a visao padrao.

            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }

            if (positionId != null) {
                predicates.add(cb.equal(root.get("position").get("id"), positionId));
            }

            if (workRegime != null) {
                predicates.add(cb.equal(root.get("workRegime"), workRegime));
            }

            if (hybridDay != null && !hybridDay.trim().isEmpty()) {
                jakarta.persistence.criteria.Expression<java.util.Collection<String>> hybridDays = root.get("hybridWorkDays");
                predicates.add(cb.isMember(hybridDay, hybridDays));
            }

            if (search != null && !search.trim().isEmpty()) {
                String cleanSearch = search.trim();
                String likePattern = "%" + cleanSearch.toLowerCase() + "%";
                
                // Trata CPF: Remove caracteres nao numericos para buscar no banco
                String digitsOnly = cleanSearch.replaceAll("\\D", "");
                
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), likePattern),
                        cb.like(cb.lower(root.get("socialName")), likePattern),
                        cb.like(cb.lower(root.get("registrationNumber")), likePattern),
                        cb.like(cb.lower(root.get("email")), likePattern),
                        digitsOnly.length() >= 3 ? cb.like(root.get("cpf"), "%" + digitsOnly + "%") : cb.disjunction()
                ));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Employee> result = employeeRepository.findAll(spec, pageable);
        log.info(">>> [DEBUG-TRACE] findWithFilters returned {} of {} elements. Page size: {}", 
                result.getContent().size(), result.getTotalElements(), pageable.getPageSize());
        return result.map(employeeMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public EmployeeStatsResponse getStats(String search, EmployeeStatus status, UUID departmentId, UUID positionId, WorkRegime workRegime, String hybridDay) {
        UUID tenantId = getTenantId();

        org.springframework.data.jpa.domain.Specification<Employee> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));
            
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));

            }
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }
            if (positionId != null) {
                predicates.add(cb.equal(root.get("position").get("id"), positionId));
            }
            if (workRegime != null) {
                predicates.add(cb.equal(root.get("workRegime"), workRegime));
            }
            if (hybridDay != null && !hybridDay.trim().isEmpty()) {
                predicates.add(cb.isMember(hybridDay, root.get("hybridWorkDays")));
            }
            if (search != null && !search.trim().isEmpty()) {
                String cleanSearch = search.trim();
                String likePattern = "%" + cleanSearch.toLowerCase() + "%";
                String digitsOnly = cleanSearch.replaceAll("\\D", "");
                
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), likePattern),
                        cb.like(cb.lower(root.get("socialName")), likePattern),
                        cb.like(cb.lower(root.get("registrationNumber")), likePattern),
                        cb.like(cb.lower(root.get("email")), likePattern),
                        digitsOnly.length() >= 3 ? cb.like(root.get("cpf"), "%" + digitsOnly + "%") : cb.disjunction()
                ));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        java.util.List<Employee> allFiltered = employeeRepository.findAll(spec);
        
        long total = allFiltered.size();
        long active = allFiltered.stream().filter(e -> e.getStatus() == EmployeeStatus.ACTIVE).count();
        long onLeave = allFiltered.stream().filter(e -> e.getStatus() == EmployeeStatus.ON_LEAVE).count();
        long terminated = allFiltered.stream().filter(e -> e.getStatus() == EmployeeStatus.TERMINATED).count();
        long pending = allFiltered.stream().filter(e -> e.getStatus() == EmployeeStatus.PENDING).count();

        long presencial = allFiltered.stream().filter(e -> e.getWorkRegime() == WorkRegime.PRESENCIAL).count();
        long remoto = allFiltered.stream().filter(e -> e.getWorkRegime() == WorkRegime.REMOTO).count();
        long hibrido = allFiltered.stream().filter(e -> e.getWorkRegime() == WorkRegime.HIBRIDO).count();

        java.math.BigDecimal totalSalary = allFiltered.stream()
                .map(e -> e.getBaseSalary() != null ? e.getBaseSalary() : java.math.BigDecimal.ZERO)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        
        java.math.BigDecimal averageSalary = total > 0 
                ? totalSalary.divide(java.math.BigDecimal.valueOf(total), 2, java.math.RoundingMode.HALF_UP) 
                : java.math.BigDecimal.ZERO;

        java.util.Map<String, Long> byDept = allFiltered.stream()
                .filter(e -> e.getDepartment() != null)
                .collect(java.util.stream.Collectors.groupingBy(e -> e.getDepartment().getName(), java.util.stream.Collectors.counting()));

        return EmployeeStatsResponse.builder()
                .total(total)
                .active(active)
                .onLeave(onLeave)
                .terminated(terminated)
                .pending(pending)
                .presencial(presencial)
                .remoto(remoto)
                .hibrido(hibrido)
                .totalMonthlySalary(totalSalary)
                .averageSalary(averageSalary)
                .byDepartment(byDept)
                .build();
    }
    @Transactional(readOnly = true)
    public byte[] exportEmployees(String search, EmployeeStatus status, UUID departmentId, UUID positionId, WorkRegime workRegime, String hybridDay, String format) {
        // Implementamos CSV por padrao por ser leve e pratico
        org.springframework.data.jpa.domain.Specification<Employee> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), getTenantId()));
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (departmentId != null) predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            if (positionId != null) predicates.add(cb.equal(root.get("position").get("id"), positionId));
            if (workRegime != null) predicates.add(cb.equal(root.get("workRegime"), workRegime));
            if (hybridDay != null && !hybridDay.trim().isEmpty()) predicates.add(cb.isMember(hybridDay, root.get("hybridWorkDays")));
            if (search != null && !search.trim().isEmpty()) {
                String likePattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), likePattern),
                        cb.like(cb.lower(root.get("socialName")), likePattern),
                        cb.like(cb.lower(root.get("registrationNumber")), likePattern),
                        cb.like(cb.lower(root.get("cpf")), likePattern),
                        cb.like(cb.lower(root.get("email")), likePattern)
                ));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        java.util.List<Employee> employees = employeeRepository.findAll(spec);
        
        StringBuilder csv = new StringBuilder();
        // Header
        csv.append("Matricula;Nome Completo;CPF;Email;Departamento;Cargo;Status;Regime;Dias Hibridos;Salario Base\n");
        
        for (Employee e : employees) {
            csv.append(e.getRegistrationNumber()).append(";");
            csv.append(e.getFullName()).append(";");
            csv.append(e.getCpf()).append(";");
            csv.append(e.getEmail()).append(";");
            csv.append(e.getDepartment() != null ? e.getDepartment().getName() : "-").append(";");
            csv.append(e.getPosition() != null ? e.getPosition().getTitle() : "-").append(";");
            csv.append(e.getStatus()).append(";");
            csv.append(e.getWorkRegime() != null ? e.getWorkRegime() : "-").append(";");
            csv.append(e.getHybridWorkDays() != null ? String.join(",", e.getHybridWorkDays()) : "-").append(";");
            csv.append(e.getBaseSalary() != null ? e.getBaseSalary() : "0").append("\n");
        }
        
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
 
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

        // Se matricula nao existir, gera agora (retrocompatibilidade)
        if (employee.getRegistrationNumber() == null || employee.getRegistrationNumber().isBlank()) {
            employee.setRegistrationNumber(employee.getId().toString().substring(0, 8).toUpperCase());
            employeeRepository.save(employee);
        }

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

        // Salva dependentes se houver
        if (request.getDependents() != null && !request.getDependents().isEmpty()) {
            saveDependents(saved, request.getDependents(), userId);
        }

        // Registra historico
        saveHistory(saved, "CADASTRO", null, null, "Colaborador cadastrado no sistema", userId);

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
        log.info(">>> [DEBUG-CRITICAL] Update request hireDate: {}", request.getHireDate());
        employeeMapper.updateEntity(employee, request);
        
        // Explicitamente seta a data de admissao se presente no request
        if (request.getHireDate() != null) {
            employee.setHireDate(request.getHireDate());
        }
        
        // Garante matricula se nao existir
        if (employee.getRegistrationNumber() == null || employee.getRegistrationNumber().isBlank()) {
            employee.setRegistrationNumber(employee.getId().toString().substring(0, 8).toUpperCase());
        }
        
        employee.setCpf(newCpf);
        employee.setUpdatedBy(userId);

        // Carrega relacionamentos
        loadRelationships(employee, request);

        Employee saved = employeeRepository.save(employee);

        // Atualiza dependentes se houver
        if (request.getDependents() != null) {
            updateDependents(saved, request.getDependents(), userId);
        }

        // Registra historico com diferencas
        Map<String, Object> newValues = captureCurrentValues(saved);
        Map<String, Object> changes = findChanges(oldValues, newValues);
        if (!changes.isEmpty()) {
            StringBuilder description = new StringBuilder("Campos alterados: ");
            changes.forEach((field, oldVal) -> {
                Object newVal = newValues.get(field);
                description.append(translateField(field))
                           .append(" (")
                           .append(oldVal != null ? oldVal : "vazio")
                           .append(" -> ")
                           .append(newVal != null ? newVal : "vazio")
                           .append("), ");
            });
            String finalDesc = description.substring(0, description.length() - 2);
            saveHistory(saved, "ATUALIZACAO", oldValues.toString(), newValues.toString(), finalDesc, userId);
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
        saveHistory(employee, "DESATIVACAO", "Ativo", "Inativo", "Colaborador desativado", userId);

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
        saveHistory(saved, "DESLIGAMENTO", null, terminationDate.toString(), "Motivo: " + reason, userId);
        publishTerminatedEvent(saved, terminationDate, reason);

        log.info("Colaborador desligado: {} - data: {}", id, terminationDate);
        return employeeMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = "employees", key = "#id")
    public EmployeeResponse reactivate(UUID id, UUID userId) {
        UUID tenantId = getTenantId();
        log.info("Religando colaborador: {} - tenant: {}", id, tenantId);

        Employee employee = employeeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador nao encontrado: " + id));

        if (employee.getStatus() != EmployeeStatus.TERMINATED) {
            throw new IllegalStateException("Apenas colaboradores desligados podem ser religados.");
        }

        employee.reactivate();
        employee.setUpdatedBy(userId);

        Employee saved = employeeRepository.save(employee);
        saveHistory(saved, "RELIGAMENTO", "TERMINATED", "ACTIVE", "Colaborador religado no sistema", userId);
        
        // Poderiamos publicar um evento de Re-contratacao? 
        // publishUpdatedEvent(saved, Collections.singletonMap("status", "TERMINATED"), Collections.singletonMap("status", "ACTIVE"));

        log.info("Colaborador religado: {}", id);
        return employeeMapper.toResponse(saved);
    }

    /**
     * Conta colaboradores ativos.
     */
    @Transactional(readOnly = true)
    public long countActive() {
        return employeeRepository.countByTenantIdAndIsActiveTrue(getTenantId());
    }

    /**
     * Atualiza a foto do colaborador.
     */
    @Transactional
    @CacheEvict(value = "employees", key = "#id")
    public EmployeeResponse updatePhoto(UUID id, org.springframework.web.multipart.MultipartFile file, UUID userId) {
        UUID tenantId = getTenantId();
        log.info("Atualizando foto do colaborador: {} - tenant: {}", id, tenantId);

        Employee employee = employeeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador nao encontrado: " + id));

        // Deleta foto antiga se existir
        if (employee.getPhotoUrl() != null && !employee.getPhotoUrl().isEmpty()) {
            fileStorageService.deleteEmployeePhoto(employee.getPhotoUrl());
        }

        // Salva nova foto
        String photoUrl = fileStorageService.storeEmployeePhoto(file, id);
        employee.setPhotoUrl(photoUrl);
        employee.setUpdatedBy(userId);

        Employee saved = employeeRepository.save(employee);
        
        // Registra historico
        saveHistory(saved, "FOTO_ATUALIZADA", null, photoUrl, "Foto de perfil atualizada", userId);

        log.info("Foto do colaborador atualizada: {}", id);
        return employeeMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getHistory(UUID employeeId) {
        UUID tenantId = getTenantId();
        List<EmployeeHistory> histories = historyRepository.findByTenantIdAndEmployeeIdOrderByChangedAtDesc(
                tenantId, employeeId, org.springframework.data.domain.PageRequest.of(0, 50)).getContent();

        return histories.stream().map(h -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("action", h.getChangeType());
            map.put("description", h.getChangeReason() != null ? h.getChangeReason() : "Nenhuma descrição");
            map.put("createdAt", h.getChangedAt());
            
            // Resolve nome de quem fez a alteracao
            String authorName = "Sistema";
            if (h.getChangedBy() != null) {
                authorName = employeeRepository.findByUserIdWithRelations(tenantId, h.getChangedBy())
                        .map(e -> e.getFullName())
                        .orElse("Admin " + h.getChangedBy().toString().substring(0, 4));
            }
            map.put("createdBy", authorName);
            
            // Campos extras se necessario para o frontend
            map.put("oldValue", h.getOldValue());
            map.put("newValue", h.getNewValue());
            map.put("changedField", h.getChangedField());
            
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    private String translateField(String field) {
        switch (field) {
            case "fullName": return "Nome";
            case "email": return "E-mail";
            case "departmentId": return "Departamento";
            case "positionId": return "Cargo";
            case "baseSalary": return "Salário";
            case "status": return "Status";
            case "hireDate": return "Data de Admissão";
            default: return field;
        }
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

    private void saveDependents(Employee employee, List<EmployeeDependentRequest> requests, UUID userId) {
        if (requests == null) return;
        
        List<EmployeeDependent> dependents = requests.stream()
                .map(req -> {
                    EmployeeDependent dependent = employeeMapper.toEntity(req);
                    dependent.setEmployee(employee);
                    dependent.setTenantId(employee.getTenantId());
                    dependent.setCreatedBy(userId);
                    return dependent;
                })
                .collect(java.util.stream.Collectors.toList());
        
        dependentRepository.saveAll(dependents);
    }

    private void updateDependents(Employee employee, List<EmployeeDependentRequest> requests, UUID userId) {
        // Remove existing dependents (simple approach)
        List<EmployeeDependent> existing = dependentRepository.findByTenantIdAndEmployeeId(employee.getTenantId(), employee.getId());
        dependentRepository.deleteAll(existing);
        
        // Save new ones
        saveDependents(employee, requests, userId);
        
        // Registra historico
        saveHistory(employee, "DEPENDENTES_ATUALIZADOS", null, null, "Lista de dependentes atualizada", userId);
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
        values.put("hireDate", employee.getHireDate());
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
    @Transactional
    public EmployeeResponse findByUserId(UUID userId, String email) {
        UUID tenantId = getTenantId();
        
        // 1. Tenta buscar pelo UserID vinculado
        Optional<Employee> employeeOpt = employeeRepository.findByUserIdWithRelations(tenantId, userId);
        
        if (employeeOpt.isPresent()) {
            return employeeMapper.toResponse(employeeOpt.get());
        }

        // 2. Se não encontrou, tenta buscar pelo e-mail (Auto-heal)
        if (email != null && !email.isBlank()) {
            log.info(">>> [AUTO-HEAL] Tentando vincular usuario {} via email: {}", userId, email);
            Optional<Employee> byEmail = employeeRepository.findByTenantIdAndEmail(tenantId, email);
            
            if (byEmail.isPresent()) {
                Employee employee = byEmail.get();
                if (employee.getUserId() == null) {
                    log.info(">>> [AUTO-HEAL] Vinculando UserID {} ao colaborador {} ({})", userId, employee.getId(), employee.getFullName());
                    employee.setUserId(userId);
                    employeeRepository.save(employee);
                }
                return employeeMapper.toResponse(employee);
            }
        }

        throw new ResourceNotFoundException("Colaborador nao encontrado para o usuario: " + userId);
    }
}
