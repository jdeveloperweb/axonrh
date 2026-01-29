package com.axonrh.employee.controller;

import com.axonrh.employee.dto.PositionRequest;
import com.axonrh.employee.dto.PositionResponse;
import com.axonrh.employee.service.PositionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/positions")
@RequiredArgsConstructor
@Tag(name = "Cargos", description = "Gerenciamento de cargos")
public class PositionController {

    private final PositionService positionService;

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar cargos paginado")
    public ResponseEntity<Page<PositionResponse>> findAll(
            @PageableDefault(size = 20, sort = "title") Pageable pageable) {
        return ResponseEntity.ok(positionService.findAll(pageable));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar todos cargos ativos (sem paginação)")
    public ResponseEntity<List<PositionResponse>> findAllActive(
            @RequestParam(required = false) UUID departmentId) {
        return ResponseEntity.ok(positionService.findAllActive(departmentId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Buscar cargo por ID")
    public ResponseEntity<PositionResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(positionService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('POSITION:WRITE')")
    @Operation(summary = "Criar novo cargo")
    public ResponseEntity<PositionResponse> create(
            @Valid @RequestBody PositionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = jwt != null ? UUID.fromString(jwt.getSubject()) : UUID.fromString("00000000-0000-0000-0000-000000000000");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(positionService.create(request, userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('POSITION:WRITE')")
    @Operation(summary = "Atualizar cargo")
    public ResponseEntity<PositionResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PositionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = jwt != null ? UUID.fromString(jwt.getSubject()) : UUID.fromString("00000000-0000-0000-0000-000000000000");
        return ResponseEntity.ok(positionService.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('POSITION:WRITE')")
    @Operation(summary = "Excluir (desativar) cargo")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        positionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
