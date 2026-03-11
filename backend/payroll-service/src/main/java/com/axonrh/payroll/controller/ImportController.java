package com.axonrh.payroll.controller;

import com.axonrh.payroll.config.TenantContext;
import com.axonrh.payroll.service.ImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/import")
@RequiredArgsConstructor
@Tag(name = "Data Import", description = "Endpoints para carga de dados em massa")
public class ImportController {

    private final ImportService importService;

    @GetMapping("/template/payroll")
    @Operation(summary = "Gera planilha de exemplo para importação de folha")
    public ResponseEntity<byte[]> getPayrollTemplate() throws IOException {
        byte[] bytes = importService.generatePayrollTemplate();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=template_folha.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @PostMapping("/payroll")
    @Operation(summary = "Importa dados de folha a partir de uma planilha Excel")
    public ResponseEntity<Map<String, Object>> importPayroll(@RequestParam("file") MultipartFile file) throws IOException {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        Map<String, Object> result = importService.importPayroll(file, tenantId);
        return ResponseEntity.ok(result);
    }
}
