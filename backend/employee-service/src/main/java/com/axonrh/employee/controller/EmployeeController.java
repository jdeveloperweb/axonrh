package com.axonrh.employee.controller;

import com.axonrh.employee.dto.EmployeeDependentRequest;
import com.axonrh.employee.dto.EmployeeRequest;
import com.axonrh.employee.dto.EmployeeResponse;
import com.axonrh.employee.entity.enums.EmployeeStatus;
import com.axonrh.employee.service.EmployeeDependentService;
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
    private final EmployeeDependentService dependentService;

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        log.info(">>> [DEBUG-TRACE] EmployeeController.test CALLED");
        return ResponseEntity.ok("Employee service is reachable");
    }

    @GetMapping("/active")
    @Operation(summary = "Lista todos colaboradores ativos (sem paginacao)", description = "Retorna lista de colaboradores ativos, opcionalmente filtrados por departamento")
    public ResponseEntity<java.util.List<EmployeeResponse>> getActiveEmployees(
            @RequestParam(required = false) UUID departmentId) {
        log.info("Fetching all active employees for department: {}", departmentId);
        return ResponseEntity.ok(employeeService.getActiveEmployees(departmentId));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Lista colaboradores", description = "Retorna lista paginada de colaboradores com filtros opcionais")
    public ResponseEntity<Page<EmployeeResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID positionId,
            @RequestParam(required = false) com.axonrh.employee.entity.enums.WorkRegime workRegime,
            @RequestParam(required = false) String hybridDay,
            @PageableDefault(size = 20, sort = "fullName", direction = Sort.Direction.ASC) Pageable pageable) {

        log.info("Listing employees with filters: search={}, status={}, dept={}, pos={}, regime={}, day={}", search, status, departmentId, positionId, workRegime, hybridDay);
        Page<EmployeeResponse> employees = employeeService.findWithFilters(search, status, departmentId, positionId, workRegime, hybridDay, pageable);
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Retorna estatisticas de colaboradores", description = "Retorna contagens e somas baseadas nos filtros")
    public ResponseEntity<com.axonrh.employee.dto.EmployeeStatsResponse> getStats(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID positionId,
            @RequestParam(required = false) com.axonrh.employee.entity.enums.WorkRegime workRegime,
            @RequestParam(required = false) String hybridDay) {
 
        return ResponseEntity.ok(employeeService.getStats(search, status, departmentId, positionId, workRegime, hybridDay));
    }
 
    @GetMapping("/export")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Exporta colaboradores", description = "Gera arquivo de exportacao (CSV) baseado nos filtros")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID positionId,
            @RequestParam(required = false) com.axonrh.employee.entity.enums.WorkRegime workRegime,
            @RequestParam(required = false) String hybridDay,
            @RequestParam(defaultValue = "csv") String format) {
 
        byte[] data = employeeService.exportEmployees(search, status, departmentId, positionId, workRegime, hybridDay, format);
        
        String filename = "colaboradores_" + java.time.LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv"))
                .body(data);
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

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Retorna histórico de alterações do colaborador")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getHistory(
            @Parameter(description = "ID do colaborador") @PathVariable UUID id) {

        log.info("Buscando histórico do colaborador: {}", id);
        return ResponseEntity.ok(employeeService.getHistory(id));
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
    public ResponseEntity<java.util.Map<String, Object>> validateCpf(
            @Parameter(description = "CPF a validar") @PathVariable String cpf) {

        log.debug("Validando CPF: {}", cpf);
        boolean exists = employeeService.existsByCpf(cpf);
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("exists", exists);
        response.put("valid", !exists);
        if (exists) {
            response.put("message", "CPF já cadastrado");
        }
        
        return ResponseEntity.ok(response);
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

    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Reativa (religa) um colaborador desligado")
    public ResponseEntity<EmployeeResponse> reactivate(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        log.info("Religando colaborador: {}", id);
        EmployeeResponse reactivated = employeeService.reactivate(id, userId);
        return ResponseEntity.ok(reactivated);
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

    @GetMapping("/{id}/dependents")
    //@PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Lista dependentes do colaborador")
    public ResponseEntity<java.util.List<EmployeeResponse.DependentSummary>> getDependents(@PathVariable UUID id) {
        log.info("Buscando dependentes do colaborador: {}", id);
        return ResponseEntity.ok(dependentService.findByEmployeeId(id));
    }

    @PostMapping("/{id}/dependents")
    //@PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Adiciona um dependente ao colaborador")
    public ResponseEntity<EmployeeResponse.DependentSummary> addDependent(
            @PathVariable UUID id,
            @Valid @RequestBody EmployeeDependentRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        
        log.info("Adicionando dependente ao colaborador: {}", id);
        return ResponseEntity.status(HttpStatus.CREATED).body(dependentService.save(id, request, userId));
    }

    @PutMapping("/{id}/dependents/{dependentId}")
    //@PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Atualiza um dependente do colaborador")
    public ResponseEntity<EmployeeResponse.DependentSummary> updateDependent(
            @PathVariable UUID id,
            @PathVariable UUID dependentId,
            @Valid @RequestBody EmployeeDependentRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        
        log.info("Atualizando dependente {} do colaborador: {}", dependentId, id);
        return ResponseEntity.ok(dependentService.update(id, dependentId, request, userId));
    }

    @DeleteMapping("/{id}/dependents/{dependentId}")
    //@PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Remove um dependente do colaborador")
    public ResponseEntity<Void> removeDependent(
            @PathVariable UUID id,
            @PathVariable UUID dependentId) {
        
        log.info("Removendo dependente {} do colaborador: {}", dependentId, id);
        dependentService.delete(id, dependentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/dependents/bulk")
    //@PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Salva lista de dependentes do colaborador (substitui existentes)")
    public ResponseEntity<java.util.List<EmployeeResponse.DependentSummary>> saveDependentsBulk(
            @PathVariable UUID id,
            @Valid @RequestBody java.util.List<EmployeeDependentRequest> requests,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        
        log.info("Salvando dependentes em lote para o colaborador: {}", id);
        return ResponseEntity.ok(dependentService.saveAll(id, requests, userId));
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
    @GetMapping("/me")
    @Operation(summary = "Busca dados do colaborador logado")
    public ResponseEntity<EmployeeResponse> getMe(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader(value = "X-User-Email", required = false) String email) {
        log.info("Buscando dados do colaborador para o usuario: {} (email: {})", userId, email);
        return ResponseEntity.ok(employeeService.findByUserId(userId, email));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Busca colaborador por User ID")
    public ResponseEntity<EmployeeResponse> findByUserId(@PathVariable UUID userId, @RequestParam(required = false) String email) {
        return ResponseEntity.ok(employeeService.findByUserId(userId, email));
    }
}
