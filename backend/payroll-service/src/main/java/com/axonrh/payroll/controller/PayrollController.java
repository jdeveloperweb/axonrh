package com.axonrh.payroll.controller;

import com.axonrh.payroll.dto.*;
import com.axonrh.payroll.service.PayrollService;
import com.axonrh.payroll.service.PayrollPdfService;
import io.swagger.v3.oas.annotations.Operation;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Folha de Pagamento", description = "Gestao de folha de pagamento")
public class PayrollController {

    private final PayrollService payrollService;
    private final PayrollPdfService payrollPdfService;

    @PostMapping("/process")
    @Operation(summary = "Processar folha individual",
               description = "Calcula a folha de pagamento de um colaborador para a competencia informada")
    public ResponseEntity<PayrollResponse> processPayroll(@Valid @RequestBody PayrollRequest request) {
        log.info("POST /api/v1/payroll/process - Colaborador: {}, Competencia: {}/{}",
                request.getEmployeeId(), request.getReferenceMonth(), request.getReferenceYear());
        PayrollResponse response = payrollService.processPayroll(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/process/batch")
    @Operation(summary = "Processar folha em lote",
               description = "Calcula a folha de pagamento para todos os colaboradores ativos ou uma lista especifica")
    public ResponseEntity<PayrollRunResponse> processBatch(@Valid @RequestBody PayrollBatchRequest request) {
        log.info("POST /api/v1/payroll/process/batch - Competencia: {}/{}",
                request.getReferenceMonth(), request.getReferenceYear());
        PayrollRunResponse response = payrollService.processBatch(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar folha por ID",
               description = "Retorna os detalhes completos de uma folha de pagamento")
    public ResponseEntity<PayrollResponse> findById(@PathVariable UUID id) {
        PayrollResponse response = payrollService.findById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/payslip")
    @Operation(summary = "Gerar demonstrativo (holerite)",
               description = "Retorna o holerite completo em JSON para exibicao ou impressao")
    public ResponseEntity<PayslipResponse> generatePayslip(@PathVariable UUID id) {
        log.info("GET /api/v1/payroll/{}/payslip", id);
        PayslipResponse response = payrollService.generatePayslip(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/export/pdf")
    @Operation(summary = "Exportar holerite em PDF",
               description = "Gera o arquivo PDF do holerite para download")
    public ResponseEntity<byte[]> exportPayslipPdf(@PathVariable UUID id) {
        log.info("GET /api/v1/payroll/{}/export/pdf", id);
        PayslipResponse payslip = payrollService.generatePayslip(id);
        byte[] pdf = payrollPdfService.generatePayslipPdf(payslip);
        
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=holerite_" + id + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/competency")
    @Operation(summary = "Listar folhas por competencia",
               description = "Lista todas as folhas de uma competencia especifica com paginacao")
    public ResponseEntity<Page<PayrollResponse>> findByCompetency(
            @RequestParam Integer month,
            @RequestParam Integer year,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PayrollResponse> response = payrollService.findByCompetency(month, year, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/employees/{employeeId}/history")
    @Operation(summary = "Historico de folhas do colaborador",
               description = "Retorna todas as folhas de pagamento de um colaborador ordenadas por data")
    public ResponseEntity<List<PayrollResponse>> findByEmployee(@PathVariable UUID employeeId) {
        List<PayrollResponse> response = payrollService.findByEmployee(employeeId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/close")
    @Operation(summary = "Fechar competencia",
               description = "Fecha uma competencia impedindo qualquer alteracao nas folhas")
    public ResponseEntity<PayrollRunResponse> closeCompetency(
            @RequestParam Integer month,
            @RequestParam Integer year,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        log.info("POST /api/v1/payroll/close - Competencia: {}/{}", month, year);
        PayrollRunResponse response = payrollService.closeCompetency(month, year, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/runs")
    @Operation(summary = "Listar processamentos",
               description = "Lista todos os processamentos de folha (PayrollRuns) com paginacao")
    public ResponseEntity<Page<PayrollRunResponse>> findAllRuns(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PayrollRunResponse> response = payrollService.findAllRuns(pageable);
        return ResponseEntity.ok(response);
    }
}
