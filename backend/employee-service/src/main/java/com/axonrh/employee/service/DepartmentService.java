package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.*;
import com.axonrh.employee.entity.CostCenter;
import com.axonrh.employee.entity.Department;
import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.repository.CostCenterRepository;
import com.axonrh.employee.repository.DepartmentRepository;
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
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final CostCenterRepository costCenterRepository;

    @Transactional(readOnly = true)
    public List<DepartmentDTO> findAll() {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        List<Department> departments = departmentRepository.findByTenantIdAndIsActiveTrueOrderByName(tenantId);
        return departments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentDTO findById(UUID id) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        Department department = departmentRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException("Departamento não encontrado"));
        return convertToDTO(department);
    }

    @Transactional
    public DepartmentDTO create(CreateDepartmentDTO dto) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        
        // Validar código único
        if (departmentRepository.existsByTenantIdAndCode(tenantId, dto.getCode())) {
            throw new RuntimeException("Já existe um departamento com este código");
        }
        
        Department department = Department.builder()
                .tenantId(tenantId)
                .code(dto.getCode())
                .name(dto.getName())
                .description(dto.getDescription())
                .isActive(true)
                .build();
        
        // Definir departamento pai se fornecido
        if (dto.getParentId() != null) {
            Department parent = departmentRepository.findByTenantIdAndId(tenantId, dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Departamento pai não encontrado"));
            department.setParent(parent);
        }
        
        // Definir gestor se fornecido
        if (dto.getManagerId() != null) {
            validateManager(tenantId, dto.getManagerId());
            department.setManagerId(dto.getManagerId());
        }
        
        // Definir centro de custo se fornecido
        if (dto.getCostCenterId() != null) {
            CostCenter costCenter = costCenterRepository.findById(dto.getCostCenterId())
                    .orElseThrow(() -> new RuntimeException("Centro de custo não encontrado"));
            department.setCostCenter(costCenter);
        }
        
        Department saved = departmentRepository.save(department);
        log.info("Departamento criado: {} - {}", saved.getCode(), saved.getName());
        
        return convertToDTO(saved);
    }

    @Transactional
    public DepartmentDTO update(UUID id, UpdateDepartmentDTO dto) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        
        Department department = departmentRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException("Departamento não encontrado"));
        
        // Atualizar código se fornecido
        if (dto.getCode() != null && !dto.getCode().equals(department.getCode())) {
            if (departmentRepository.existsByTenantIdAndCode(tenantId, dto.getCode())) {
                throw new RuntimeException("Já existe um departamento com este código");
            }
            department.setCode(dto.getCode());
        }
        
        // Atualizar outros campos - sempre atualiza se fornecido
        if (dto.getName() != null) {
            department.setName(dto.getName());
        }
        // Permite limpar a descrição
        if (dto.getDescription() != null) {
            department.setDescription(dto.getDescription().isEmpty() ? null : dto.getDescription());
        }
        if (dto.getIsActive() != null) {
            department.setIsActive(dto.getIsActive());
        }
        
        // Atualizar departamento pai
        if (dto.getParentId() != null) {
            Department parent = departmentRepository.findByTenantIdAndId(tenantId, dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Departamento pai não encontrado"));
            department.setParent(parent);
        }
        
        // Atualizar gestor - permite remover gestor enviando null
        if (dto.getManagerId() != null) {
            validateManager(tenantId, dto.getManagerId());
            department.setManagerId(dto.getManagerId());
        }
        
        // Atualizar centro de custo
        if (dto.getCostCenterId() != null) {
            CostCenter costCenter = costCenterRepository.findById(dto.getCostCenterId())
                    .orElseThrow(() -> new RuntimeException("Centro de custo não encontrado"));
            department.setCostCenter(costCenter);
        }
        
        Department updated = departmentRepository.save(department);
        log.info("Departamento atualizado: {} - {}", updated.getCode(), updated.getName());
        
        return convertToDTO(updated);
    }

    @Transactional
    public void delete(UUID id) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        
        Department department = departmentRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException("Departamento não encontrado"));
        
        // Soft delete
        department.setIsActive(false);
        departmentRepository.save(department);
        
        log.info("Departamento excluído (soft delete): {} - {}", department.getCode(), department.getName());
    }

    @Transactional
    public DepartmentDTO assignManager(UUID departmentId, UUID managerId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        
        Department department = departmentRepository.findByTenantIdAndId(tenantId, departmentId)
                .orElseThrow(() -> new RuntimeException("Departamento não encontrado"));
        
        if (managerId != null) {
            validateManager(tenantId, managerId);
        }
        
        department.setManagerId(managerId);
        Department updated = departmentRepository.save(department);
        
        log.info("Gestor {} atribuído ao departamento {}", managerId, departmentId);
        
        return convertToDTO(updated);
    }

    @Transactional
    public DepartmentDTO removeManager(UUID departmentId) {
        return assignManager(departmentId, null);
    }

    @Transactional(readOnly = true)
    public List<DepartmentDTO> findByManagerId(UUID managerId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        List<Department> departments = departmentRepository.findByTenantIdAndManagerId(tenantId, managerId);
        return departments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private void validateManager(UUID tenantId, UUID managerId) {
        employeeRepository.findByTenantIdAndId(tenantId, managerId)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
    }

    private DepartmentDTO convertToDTO(Department department) {
        DepartmentDTO.DepartmentDTOBuilder builder = DepartmentDTO.builder()
                .id(department.getId())
                .code(department.getCode())
                .name(department.getName())
                .description(department.getDescription())
                .isActive(department.getIsActive())
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                .createdBy(department.getCreatedBy())
                .updatedBy(department.getUpdatedBy());
        
        // Departamento pai
        if (department.getParent() != null) {
            try {
                builder.parent(DepartmentDTO.ParentDepartmentDTO.builder()
                        .id(department.getParent().getId())
                        .code(department.getParent().getCode())
                        .name(department.getParent().getName())
                        .build());
            } catch (Exception e) {
                log.warn("Falha ao carregar departamento pai para {}: {}", department.getId(), e.getMessage());
            }
        }
        
        // Gestor
        if (department.getManagerId() != null) {
            UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
            employeeRepository.findByTenantIdAndId(tenantId, department.getManagerId())
                    .ifPresent(manager -> {
                        String positionName = null;
                        try {
                            if (manager.getPosition() != null) {
                                positionName = manager.getPosition().getTitle();
                            }
                        } catch (Exception e) {
                            log.warn("Falha ao carregar cargo do gestor {}: {}", manager.getId(), e.getMessage());
                        }

                        builder.manager(DepartmentDTO.ManagerBasicDTO.builder()
                                .id(manager.getId())
                                .registrationNumber(manager.getRegistrationNumber())
                                .fullName(manager.getFullName())
                                .email(manager.getEmail())
                                .positionName(positionName)
                                .build());
                    });
        }
        
        // Centro de custo
        if (department.getCostCenter() != null) {
            try {
                builder.costCenter(DepartmentDTO.CostCenterBasicDTO.builder()
                        .id(department.getCostCenter().getId())
                        .code(department.getCostCenter().getCode())
                        .name(department.getCostCenter().getName())
                        .build());
            } catch (Exception e) {
                log.warn("Falha ao carregar centro de custo para {}: {}", department.getId(), e.getMessage());
            }
        }
        
        // Contadores
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        Long employeeCount = employeeRepository.countByTenantIdAndDepartmentIdAndIsActiveTrue(tenantId, department.getId());
        Long subdepartmentCount = departmentRepository.countByTenantIdAndParentId(tenantId, department.getId());
        
        builder.employeeCount(employeeCount);
        builder.subdepartmentCount(subdepartmentCount);
        
        return builder.build();
    }
}
