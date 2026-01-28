package com.axonrh.employee.controller;

import com.axonrh.employee.dto.*;
import com.axonrh.employee.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Departamentos", description = "Gestao de departamentos")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Lista todos os departamentos ativos")
    public ResponseEntity<List<DepartmentDTO>> findAll() {
        log.info("Listando todos os departamentos");
        List<DepartmentDTO> departments = departmentService.findAll();
        return ResponseEntity.ok(departments);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Busca departamento por ID")
    public ResponseEntity<DepartmentDTO> findById(@PathVariable UUID id) {
        log.info("Buscando departamento: {}", id);
        DepartmentDTO department = departmentService.findById(id);
        return ResponseEntity.ok(department);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Cria novo departamento")
    public ResponseEntity<DepartmentDTO> create(@Valid @RequestBody CreateDepartmentDTO dto) {
        log.info("Criando departamento: {}", dto.getName());
        DepartmentDTO created = departmentService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Atualiza departamento existente")
    public ResponseEntity<DepartmentDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDepartmentDTO dto) {
        log.info("Atualizando departamento: {}", id);
        DepartmentDTO updated = departmentService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:DELETE')")
    @Operation(summary = "Exclui departamento (soft delete)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        log.info("Excluindo departamento: {}", id);
        departmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/manager")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Atribui gestor ao departamento")
    public ResponseEntity<DepartmentDTO> assignManager(
            @PathVariable UUID id,
            @RequestBody AssignManagerDTO dto) {
        log.info("Atribuindo gestor {} ao departamento {}", dto.getManagerId(), id);
        DepartmentDTO updated = departmentService.assignManager(id, dto.getManagerId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}/manager")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Remove gestor do departamento")
    public ResponseEntity<DepartmentDTO> removeManager(@PathVariable UUID id) {
        log.info("Removendo gestor do departamento {}", id);
        DepartmentDTO updated = departmentService.removeManager(id);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/manager/{managerId}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Lista departamentos por gestor")
    public ResponseEntity<List<DepartmentDTO>> findByManager(@PathVariable UUID managerId) {
        log.info("Buscando departamentos do gestor: {}", managerId);
        List<DepartmentDTO> departments = departmentService.findByManagerId(managerId);
        return ResponseEntity.ok(departments);
    }
}
