package com.axonrh.auth.controller;

import com.axonrh.auth.dto.RoleRequest;
import com.axonrh.auth.dto.RoleResponse;
import com.axonrh.auth.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Tag(name = "Roles", description = "Gerenciamento de Perfis de Acesso")
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    @Operation(summary = "Listar perfis", description = "Lista todos os perfis de acesso")
    @PreAuthorize("hasAnyAuthority('ROLE:READ', 'ROLE_ADMIN')")
    public ResponseEntity<List<RoleResponse>> listRoles() {
        return ResponseEntity.ok(roleService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar perfil", description = "Busca um perfil pelo ID")
    @PreAuthorize("hasAnyAuthority('ROLE:READ', 'ROLE_ADMIN')")
    public ResponseEntity<RoleResponse> getRole(@PathVariable UUID id) {
        return ResponseEntity.ok(roleService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Criar perfil", description = "Cria um novo perfil de acesso")
    @PreAuthorize("hasAnyAuthority('ROLE:CREATE', 'ROLE_ADMIN')")
    public ResponseEntity<RoleResponse> createRole(@Valid @RequestBody RoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar perfil", description = "Atualiza um perfil existente e suas permissoes")
    @PreAuthorize("hasAnyAuthority('ROLE:UPDATE', 'ROLE_ADMIN')")
    public ResponseEntity<RoleResponse> updateRole(@PathVariable UUID id, @Valid @RequestBody RoleRequest request) {
        return ResponseEntity.ok(roleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir perfil", description = "Exclui um perfil de acesso")
    @PreAuthorize("hasAnyAuthority('ROLE:DELETE', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteRole(@PathVariable UUID id) {
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
