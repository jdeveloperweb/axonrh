package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.EmployeeDependentRequest;
import com.axonrh.employee.dto.EmployeeResponse;
import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.entity.EmployeeDependent;
import com.axonrh.employee.exception.ResourceNotFoundException;
import com.axonrh.employee.mapper.EmployeeMapper;
import com.axonrh.employee.repository.EmployeeDependentRepository;
import com.axonrh.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeDependentService {

    private final EmployeeDependentRepository dependentRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeMapper employeeMapper;

    @Transactional(readOnly = true)
    public List<EmployeeResponse.DependentSummary> findByEmployeeId(UUID employeeId) {
        UUID tenantId = getTenantId();
        return dependentRepository.findByTenantIdAndEmployeeId(tenantId, employeeId)
                .stream()
                .map(employeeMapper::toDependentSummary)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<EmployeeResponse.DependentSummary> saveAll(UUID employeeId, List<EmployeeDependentRequest> requests, UUID userId) {
        UUID tenantId = getTenantId();
        
        Employee employee = employeeRepository.findByTenantIdAndId(tenantId, employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador nao encontrado: " + employeeId));

        // Get existing dependents to identify which to delete/update
        List<EmployeeDependent> existingDependents = dependentRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
        
        // Simple approach for now: delete all and recreate, or update if we had IDs in request.
        // Assuming the request sends the full list.
        
        dependentRepository.deleteAll(existingDependents);

        List<EmployeeDependent> toSave = requests.stream()
                .map(req -> {
                    EmployeeDependent entity = employeeMapper.toEntity(req);
                    entity.setTenantId(tenantId);
                    entity.setEmployee(employee);
                    entity.setCreatedBy(userId);
                    return entity;
                })
                .collect(Collectors.toList());

        return dependentRepository.saveAll(toSave)
                .stream()
                .map(employeeMapper::toDependentSummary)
                .collect(Collectors.toList());
    }

    private UUID getTenantId() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null) {
            throw new IllegalStateException("Tenant nao definido no contexto");
        }
        return UUID.fromString(tenant);
    }
}
