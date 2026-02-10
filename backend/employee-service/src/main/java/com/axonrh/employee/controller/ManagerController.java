package com.axonrh.employee.controller;

import com.axonrh.employee.dto.ManagerDTO;
import com.axonrh.employee.dto.EmployeeResponse;
import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.service.ManagerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller para gestão de gestores e suas relações com departamentos.
 */
@RestController
@RequestMapping("/api/v1/managers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Gestores", description = "Gestao de gestores e departamentos")
public class ManagerController {

    private final ManagerService managerService;

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Lista todos os gestores")
    public ResponseEntity<List<ManagerDTO>> findAll() {
        log.info("Listando todos os gestores");
        List<ManagerDTO> managers = managerService.findAllManagers();
        return ResponseEntity.ok(managers);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Busca detalhes de um gestor")
    public ResponseEntity<ManagerDTO> findById(@PathVariable UUID id) {
        log.info("Buscando detalhes do gestor: {}", id);
        ManagerDTO manager = managerService.getManagerDetails(id);
        return ResponseEntity.ok(manager);
    }

    @GetMapping("/{id}/departments")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Lista departamentos gerenciados por um gestor")
    public ResponseEntity<List<ManagerDTO.ManagedDepartmentDTO>> getDepartments(@PathVariable UUID id) {
        log.info("Buscando departamentos do gestor: {}", id);
        List<ManagerDTO.ManagedDepartmentDTO> departments = managerService.getDepartmentsByManager(id);
        return ResponseEntity.ok(departments);
    }

    @GetMapping("/{id}/subordinates")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Lista subordinados de um gestor")
    public ResponseEntity<List<EmployeeResponse>> getSubordinates(@PathVariable UUID id) {
        log.info("Buscando subordinados do gestor: {}", id);
        List<EmployeeResponse> subordinates = managerService.getSubordinates(id);
        return ResponseEntity.ok(subordinates);
    }
}
