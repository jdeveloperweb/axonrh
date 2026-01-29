package com.axonrh.employee.controller;

import com.axonrh.employee.dto.EmployeeRequest;
import com.axonrh.employee.dto.EmployeeResponse;
import com.axonrh.employee.entity.enums.EmployeeStatus;
import com.axonrh.employee.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Controller REST para gestao de colaboradores.
 */
@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Colaboradores", description = "Gestao de colaboradores")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        log.info(">>> [DEBUG-TRACE] EmployeeController.test CALLED");
        return ResponseEntity.ok("Employee service is reachable");
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Lista colaboradores", description = "Retorna lista paginada de colaboradores com filtros opcionais")
    public ResponseEntity<Page<EmployeeResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID positionId,
            @PageableDefault(size = 20, sort = "fullName", direction = Sort.Direction.ASC) Pageable pageable) {

        log.info("Listing employees with filters: search={}, status={}, dept={}, pos={}", search, status, departmentId, positionId);
        Page<EmployeeResponse> employees = employeeService.findWithFilters(search, status, departmentId, positionId, pageable);
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Lista colaboradores por status")
    public ResponseEntity<Page<EmployeeResponse>> findByStatus(
            @PathVariable EmployeeStatus status,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<EmployeeResponse> employees = employeeService.findByStatus(status, pageable);
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Busca colaborador por ID")
    public ResponseEntity<EmployeeResponse> findById(
            @Parameter(description = "ID do colaborador") @PathVariable UUID id) {

        EmployeeResponse employee = employeeService.findById(id);
        return ResponseEntity.ok(employee);
    }

    @GetMapping("/cpf/{cpf}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Busca colaborador por CPF")
    public ResponseEntity<EmployeeResponse> findByCpf(
            @Parameter(description = "CPF do colaborador") @PathVariable String cpf) {

        EmployeeResponse employee = employeeService.findByCpf(cpf);
        return ResponseEntity.ok(employee);
    }

    @GetMapping("/validate-cpf/{cpf}")
    @Operation(summary = "Valida se CPF ja esta cadastrado")
    public ResponseEntity<java.util.Map<String, Boolean>> validateCpf(
            @Parameter(description = "CPF a validar") @PathVariable String cpf) {

        log.debug("Validando CPF: {}", cpf);
        boolean exists = employeeService.existsByCpf(cpf);
        return ResponseEntity.ok(java.util.Map.of("exists", exists));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Pesquisa colaboradores por nome")
    public ResponseEntity<Page<EmployeeResponse>> searchByName(
            @RequestParam String name,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<EmployeeResponse> employees = employeeService.searchByName(name, pageable);
        return ResponseEntity.ok(employees);
    }

    @PostMapping
    // @PreAuthorize("hasAuthority('EMPLOYEE:CREATE')")
    @Operation(summary = "Cria novo colaborador")
    public ResponseEntity<EmployeeResponse> create(
            @Valid @RequestBody EmployeeRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        log.info(">>> [DEBUG-CRITICAL] ENTERED EmployeeController.create");

        System.err.println(">>> [DEBUG-CRITICAL] EmployeeController.create ENTERED");
        System.err.println(">>> [DEBUG-CRITICAL] Payload Name: " + request.getFullName());
        log.info(">>> [LOG-TRACE] Criando colaborador: {}", request.getFullName());
        
        try {
            EmployeeResponse created = employeeService.create(request, userId);
            System.err.println(">>> [DEBUG-CRITICAL] EmployeeService.create SUCCESS");
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            System.err.println(">>> [DEBUG-CRITICAL] EmployeeService.create FAILED: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/{id}")
    // @PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Atualiza colaborador")
    public ResponseEntity<EmployeeResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody EmployeeRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        log.info(">>> [DEBUG] Atualizando colaborador: {}", id);
        log.info(">>> [DEBUG] User ID: {}", userId);
        EmployeeResponse updated = employeeService.update(id, request, userId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:DELETE')")
    @Operation(summary = "Desativa colaborador")
    public ResponseEntity<Void> deactivate(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID userId) {

        log.info("Desativando colaborador: {}", id);
        employeeService.deactivate(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/terminate")
    @PreAuthorize("hasAuthority('EMPLOYEE:TERMINATE')")
    @Operation(summary = "Efetua desligamento do colaborador")
    public ResponseEntity<EmployeeResponse> terminate(
            @PathVariable UUID id,
            @RequestParam LocalDate terminationDate,
            @RequestParam(required = false) String reason,
            @RequestHeader("X-User-Id") UUID userId) {

        log.info("Desligando colaborador: {} - data: {}", id, terminationDate);
        EmployeeResponse terminated = employeeService.terminate(id, terminationDate, reason, userId);
        return ResponseEntity.ok(terminated);
    }

    @GetMapping("/count")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Conta colaboradores ativos")
    public ResponseEntity<Long> countActive() {
        long count = employeeService.countActive();
        return ResponseEntity.ok(count);
    }

    @PostMapping("/{id}/photo")
    // @PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Atualiza foto do colaborador")
    public ResponseEntity<EmployeeResponse> updatePhoto(
            @PathVariable UUID id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        log.info("Atualizando foto do colaborador: {}", id);
        EmployeeResponse updated = employeeService.updatePhoto(id, file, userId);
        return ResponseEntity.ok(updated);
    }


    // DEBUG: Exception Handler temporario
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationExceptions(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        System.err.println(">>> [DEBUG-TRACE] VALIDATION ERROR: " + ex.getMessage());
        ex.getBindingResult().getAllErrors().forEach(error -> {
            System.err.println(">>> [DEBUG-TRACE] FIELD ERROR: " + error.toString());
        });
        return ResponseEntity.badRequest().body(ex.getBindingResult().getAllErrors());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex) {
        System.err.println(">>> [DEBUG-TRACE] GENERIC ERROR: " + ex.getMessage());
        ex.printStackTrace();
        return ResponseEntity.internalServerError().body(ex.getMessage());
    }
}
