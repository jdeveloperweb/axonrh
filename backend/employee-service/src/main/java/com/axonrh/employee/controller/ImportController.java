package com.axonrh.employee.controller;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.service.ImportService;
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

    @GetMapping("/template/employees")
    @Operation(summary = "Gera planilha de exemplo para importação de colaboradores")
    public ResponseEntity<byte[]> getEmployeeTemplate() throws IOException {
        byte[] bytes = importService.generateEmployeeTemplate();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=template_colaboradores.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @PostMapping("/employees")
    @Operation(summary = "Importa colaboradores a partir de uma planilha Excel")
    public ResponseEntity<Map<String, Object>> importEmployees(@RequestParam("file") MultipartFile file) throws IOException {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        Map<String, Object> result = importService.importEmployees(file, tenantId);
        return ResponseEntity.ok(result);
    }
}
