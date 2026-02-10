package com.axonrh.auth.service;

import com.axonrh.auth.dto.PermissionDTO;
import com.axonrh.auth.dto.RoleRequest;
import com.axonrh.auth.dto.RoleResponse;
import com.axonrh.auth.entity.Permission;
import com.axonrh.auth.entity.Role;
import com.axonrh.auth.repository.PermissionRepository;
import com.axonrh.auth.repository.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<RoleResponse> findAll() {
        return roleRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoleResponse findById(UUID id) {
        return roleRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Perfil nao encontrado"));
    }

    @Transactional
    public RoleResponse create(RoleRequest request) {
        Role role = new Role();
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        role.setActive(request.isActive());
        
        updatePermissions(role, request.getPermissionIds());

        role = roleRepository.save(role);
        return toResponse(role);
    }

    @Transactional
    public RoleResponse update(UUID id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Perfil nao encontrado"));
        
        // Nao permitir editar nome de papeis de sistema para evitar conflitos
        if (role.isSystemRole() && !role.getName().equals(request.getName())) {
             // Opcional: lancar excessao ou ignorar. 
             // Vamos permitir apenas atualizar descricao e permissoes se for system role
             // Mas o nome e fixo.
        } else {
            role.setName(request.getName());
        }
        
        role.setDescription(request.getDescription());
        role.setActive(request.isActive());

        updatePermissions(role, request.getPermissionIds());

        role = roleRepository.save(role);
        return toResponse(role);
    }

    @Transactional
    public void delete(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Perfil nao encontrado"));
        
        if (role.isSystemRole()) {
            throw new IllegalArgumentException("Nao e possivel excluir perfis do sistema");
        }
        
        roleRepository.delete(role);
    }

    private void updatePermissions(Role role, List<UUID> permissionIds) {
        if (permissionIds == null) {
            return;
        }
        
        Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(permissionIds));
        role.setPermissions(permissions);
    }

    private RoleResponse toResponse(Role role) {
        List<PermissionDTO> permissionDTOS = role.getPermissions().stream()
                .map(p -> new PermissionDTO(
                        p.getId(), 
                        p.getResource(), 
                        p.getAction(), 
                        p.getDisplayName(), 
                        p.getDescription(), 
                        p.getModule(), 
                        p.getCode(), 
                        p.getCreatedAt()))
                .collect(Collectors.toList());

        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .systemRole(role.isSystemRole())
                .hierarchyLevel(role.getHierarchyLevel())
                .active(role.isActive())
                .permissions(permissionDTOS)
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }
}
