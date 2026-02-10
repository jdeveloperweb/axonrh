package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.EmployeeResponse;
import com.axonrh.employee.dto.ManagerDTO;
import com.axonrh.employee.entity.Department;
import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.mapper.EmployeeMapper;
import com.axonrh.employee.repository.DepartmentRepository;
import com.axonrh.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Serviço para gestão de gestores e suas relações com departamentos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ManagerService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeMapper employeeMapper;

    @Transactional(readOnly = true)
    public List<ManagerDTO> findAllManagers() {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        
        // Buscar todos os departamentos ativos
        List<Department> departments = departmentRepository.findByTenantIdAndIsActiveTrueOrderByName(tenantId);
        
        // Extrair IDs únicos de gestores
        List<UUID> managerIds = departments.stream()
                .map(Department::getManagerId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        
        // Buscar funcionários que são gestores
        return managerIds.stream()
                .map(managerId -> {
                    Employee employee = employeeRepository.findByTenantIdAndId(tenantId, managerId)
                            .orElse(null);
                    if (employee != null) {
                        return convertToDTO(employee);
                    }
                    return null;
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ManagerDTO getManagerDetails(UUID managerId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        
        Employee employee = employeeRepository.findByTenantIdAndId(tenantId, managerId)
                .orElseThrow(() -> new RuntimeException("Gestor não encontrado"));
        
        return convertToDTO(employee);
    }

    @Transactional(readOnly = true)
    public List<ManagerDTO.ManagedDepartmentDTO> getDepartmentsByManager(UUID managerId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        
        List<Department> departments = departmentRepository.findByTenantIdAndManagerId(tenantId, managerId);
        
        return departments.stream()
                .map(dept -> {
                    Long employeeCount = employeeRepository.countByTenantIdAndDepartmentIdAndIsActiveTrue(
                            tenantId, dept.getId());
                    
                    return ManagerDTO.ManagedDepartmentDTO.builder()
                            .id(dept.getId())
                            .code(dept.getCode())
                            .name(dept.getName())
                            .employeeCount(employeeCount)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getSubordinates(UUID managerId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        
        // Tenta resolver o ID. Pode ser um EmployeeID ou um UserID (vindo do frontend).
        UUID resolvedManagerId = managerId;
        
        // Verifica se existe um colaborador com este ID
        if (employeeRepository.findByTenantIdAndId(tenantId, managerId).isEmpty()) {
            // Se não encontrar por ID, tenta buscar pelo User ID
            resolvedManagerId = employeeRepository.findByTenantIdAndUserId(tenantId, managerId)
                    .map(Employee::getId)
                    .orElse(managerId); // Se não encontrar nenhum, mantem o original para retornar vazio na busca
            
            if (!resolvedManagerId.equals(managerId)) {
                log.debug("Resolvido UserID {} para EmployeeID {} na busca de subordinados", managerId, resolvedManagerId);
            }
        }

        return employeeRepository.findByManagementSpan(tenantId, resolvedManagerId)
                .stream()
                .map(employeeMapper::toResponse)
                .collect(Collectors.toList());
    }

    private ManagerDTO convertToDTO(Employee employee) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        
        // Buscar departamentos gerenciados
        List<ManagerDTO.ManagedDepartmentDTO> managedDepartments = getDepartmentsByManager(employee.getId());
        
        // Contar subordinados
        Long totalSubordinates = (long) employeeRepository
                .findByTenantIdAndManagerIdAndIsActiveTrue(tenantId, employee.getId())
                .size();
        
        return ManagerDTO.builder()
                .id(employee.getId())
                .registrationNumber(employee.getRegistrationNumber())
                .fullName(employee.getFullName())
                .email(employee.getEmail())
                .positionName(employee.getPosition() != null ? employee.getPosition().getTitle() : null)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .managedDepartments(managedDepartments)
                .totalSubordinates(totalSubordinates)
                .totalManagedDepartments((long) managedDepartments.size())
                .build();
    }
}
