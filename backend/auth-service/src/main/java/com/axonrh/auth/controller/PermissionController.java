package com.axonrh.auth.controller;

import com.axonrh.auth.dto.PermissionDTO;
import com.axonrh.auth.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
@Tag(name = "Permissions", description = "Gerenciamento de Permissoes")
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    @Operation(summary = "Listar permissoes", description = "Lista todas as permissoes disponiveis")
    @PreAuthorize("hasAnyAuthority('ROLE:READ', 'ADMIN')")
    public ResponseEntity<List<PermissionDTO>> listPermissions() {
        return ResponseEntity.ok(permissionService.findAll());
    }

    @GetMapping("/grouped")
    @Operation(summary = "Listar permissoes agrupadas", description = "Lista permissoes agrupadas por modulo")
    @PreAuthorize("hasAnyAuthority('ROLE:READ', 'ADMIN')")
    public ResponseEntity<Map<String, List<PermissionDTO>>> listPermissionsGrouped() {
        return ResponseEntity.ok(permissionService.findAllGroupedByModule());
    }
}
