package com.axonrh.benefits.controller;

import com.axonrh.benefits.dto.*;
import com.axonrh.benefits.service.EmployeeBenefitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/benefits/employees")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Beneficios de Colaboradores", description = "Atribuicao e gestao de beneficios por colaborador")
public class EmployeeBenefitController {

    private final EmployeeBenefitService employeeBenefitService;

    @PostMapping
    @Operation(summary = "Atribuir beneficio a colaborador")
    public ResponseEntity<EmployeeBenefitResponse> assign(
            @Valid @RequestBody EmployeeBenefitRequest request) {
        log.info("POST /api/v1/benefits/employees - Atribuindo beneficio ao colaborador: {}",
                request.getEmployeeId());
        EmployeeBenefitResponse response = employeeBenefitService.assign(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar beneficio do colaborador")
    public ResponseEntity<EmployeeBenefitResponse> update(
            @Parameter(description = "ID do beneficio do colaborador") @PathVariable UUID id,
            @Valid @RequestBody EmployeeBenefitRequest request) {
        log.info("PUT /api/v1/benefits/employees/{}", id);
        return ResponseEntity.ok(employeeBenefitService.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar beneficio do colaborador por ID")
    public ResponseEntity<EmployeeBenefitResponse> findById(
            @Parameter(description = "ID do beneficio do colaborador") @PathVariable UUID id) {
        return ResponseEntity.ok(employeeBenefitService.findById(id));
    }

    @GetMapping
    @Operation(summary = "Listar todos os beneficios (paginado)")
    public ResponseEntity<Page<EmployeeBenefitResponse>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(employeeBenefitService.findAll(pageable));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Listar beneficios de um colaborador")
    public ResponseEntity<List<EmployeeBenefitResponse>> findByEmployee(
            @Parameter(description = "ID do colaborador") @PathVariable UUID employeeId) {
        return ResponseEntity.ok(employeeBenefitService.findByEmployee(employeeId));
    }

    @GetMapping("/employee/{employeeId}/active")
    @Operation(summary = "Listar beneficios ativos de um colaborador")
    public ResponseEntity<List<EmployeeBenefitResponse>> findActiveByEmployee(
            @Parameter(description = "ID do colaborador") @PathVariable UUID employeeId) {
        return ResponseEntity.ok(employeeBenefitService.findActiveByEmployee(employeeId));
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Ativar beneficio do colaborador")
    public ResponseEntity<EmployeeBenefitResponse> activate(
            @Parameter(description = "ID do beneficio do colaborador") @PathVariable UUID id) {
        log.info("PATCH /api/v1/benefits/employees/{}/activate", id);
        return ResponseEntity.ok(employeeBenefitService.activate(id));
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Desativar beneficio do colaborador")
    public ResponseEntity<EmployeeBenefitResponse> deactivate(
            @Parameter(description = "ID do beneficio do colaborador") @PathVariable UUID id) {
        log.info("PATCH /api/v1/benefits/employees/{}/deactivate", id);
        return ResponseEntity.ok(employeeBenefitService.deactivate(id));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancelar beneficio do colaborador")
    public ResponseEntity<EmployeeBenefitResponse> cancel(
            @Parameter(description = "ID do beneficio do colaborador") @PathVariable UUID id) {
        log.info("PATCH /api/v1/benefits/employees/{}/cancel", id);
        return ResponseEntity.ok(employeeBenefitService.cancel(id));
    }

    @GetMapping("/employee/{employeeId}/calculate")
    @Operation(summary = "Calcular beneficios ativos para folha de pagamento",
            description = "Endpoint utilizado pelo payroll-service para consultar proventos e descontos ativos")
    public ResponseEntity<EmployeeBenefitCalculationResponse> calculateForPayroll(
            @Parameter(description = "ID do colaborador") @PathVariable UUID employeeId,
            @Parameter(description = "Mes de referencia") @RequestParam Integer month,
            @Parameter(description = "Ano de referencia") @RequestParam Integer year,
            @Parameter(description = "Salario base do colaborador") @RequestParam BigDecimal baseSalary) {
        log.info("GET /api/v1/benefits/employees/{}/calculate - Calculando para {}/{}",
                employeeId, month, year);
        return ResponseEntity.ok(
                employeeBenefitService.calculateBenefitsForPayroll(employeeId, month, year, baseSalary));
    }

    @GetMapping("/employee/{employeeId}/history")
    @Operation(summary = "Historico de alteracoes de beneficios do colaborador")
    public ResponseEntity<Page<BenefitHistoryResponse>> getHistory(
            @Parameter(description = "ID do colaborador") @PathVariable UUID employeeId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(employeeBenefitService.getHistory(employeeId, pageable));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Historico de alteracoes de um beneficio especifico")
    public ResponseEntity<List<BenefitHistoryResponse>> getBenefitHistory(
            @Parameter(description = "ID do beneficio do colaborador") @PathVariable UUID id) {
        return ResponseEntity.ok(employeeBenefitService.getBenefitHistory(id));
    }
}
