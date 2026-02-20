package com.axonrh.employee.controller;

import com.axonrh.employee.dto.TerminationRequest;
import com.axonrh.employee.dto.TerminationResponse;
import com.axonrh.employee.service.TerminationProcessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/terminations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Termination Process", description = "Endpoints para gestão de desligamentos")
public class TerminationProcessController {

    private final TerminationProcessService service;

    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Iniciar desligamento")
    public ResponseEntity<TerminationResponse> initiate(
            @RequestBody TerminationRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        setupTenantContext(jwt);
        UUID tenantId = UUID.fromString(com.axonrh.employee.config.TenantContext.getCurrentTenant());
        return ResponseEntity.ok(service.initiateTermination(request, tenantId));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Concluir desligamento")
    public ResponseEntity<TerminationResponse> complete(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        setupTenantContext(jwt);
        UUID userId = UUID.fromString(jwt.getSubject());
        UUID tenantId = UUID.fromString(com.axonrh.employee.config.TenantContext.getCurrentTenant());
        return ResponseEntity.ok(service.completeTermination(id, userId, tenantId));
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Reabrir desligamento")
    public ResponseEntity<TerminationResponse> reopen(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        setupTenantContext(jwt);
        UUID userId = UUID.fromString(jwt.getSubject());
        UUID tenantId = UUID.fromString(com.axonrh.employee.config.TenantContext.getCurrentTenant());
        return ResponseEntity.ok(service.reopenTermination(id, userId, tenantId));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Arquivar desligamento")
    public ResponseEntity<TerminationResponse> archive(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        setupTenantContext(jwt);
        UUID tenantId = UUID.fromString(com.axonrh.employee.config.TenantContext.getCurrentTenant());
        return ResponseEntity.ok(service.archiveTermination(id, tenantId));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Buscar por colaborador")
    public ResponseEntity<TerminationResponse> getByEmployee(
            @PathVariable UUID employeeId,
            @AuthenticationPrincipal Jwt jwt) {
        setupTenantContext(jwt);
        return ResponseEntity.ok(service.getByEmployeeId(employeeId));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar desligamentos")
    public ResponseEntity<List<TerminationResponse>> list(@AuthenticationPrincipal Jwt jwt) {
        setupTenantContext(jwt);
        UUID tenantId = UUID.fromString(com.axonrh.employee.config.TenantContext.getCurrentTenant());
        return ResponseEntity.ok(service.listByTenant(tenantId));
    }

    private void setupTenantContext(Jwt jwt) {
        String tenantId = jwt.getClaimAsString("tenant_id");
        if (tenantId == null) {
            tenantId = jwt.getClaimAsString("tenantId");
        }
        
        if (tenantId != null) {
            log.debug("Configurando TenantContext via JWT: {}", tenantId);
            com.axonrh.employee.config.TenantContext.setCurrentTenant(tenantId);
        } else {
            log.warn("Nao foi possivel encontrar tenant_id ou tenantId no JWT. Claims: {}", jwt.getClaims().keySet());
        }
    }
}
