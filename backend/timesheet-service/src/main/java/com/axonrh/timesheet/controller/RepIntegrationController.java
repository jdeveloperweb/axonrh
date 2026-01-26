package com.axonrh.timesheet.controller;

import com.axonrh.timesheet.service.RepIntegrationService;
import com.axonrh.timesheet.service.RepIntegrationService.AfdImportResult;
import com.axonrh.timesheet.service.RepIntegrationService.AfdValidationResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * T135-T136 - Controller de integracao com REP.
 */
@RestController
@RequestMapping("/api/v1/timesheet/rep")
@RequiredArgsConstructor
@Tag(name = "REP Integration", description = "API de integracao com Registrador Eletronico de Ponto")
public class RepIntegrationController {

    private final RepIntegrationService repIntegrationService;

    @PostMapping(value = "/afd/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importar AFD", description = "Importa arquivo AFD do REP (Portaria 671)")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_ADMIN', 'ADMIN')")
    public ResponseEntity<AfdImportResult> importAfdFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam String repId,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        AfdImportResult result = repIntegrationService.importAfdFile(file, repId, userId);
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/afd/validate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Validar AFD", description = "Valida estrutura do arquivo AFD antes da importacao")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_ADMIN', 'ADMIN')")
    public ResponseEntity<AfdValidationResult> validateAfdFile(
            @RequestParam("file") MultipartFile file) {

        AfdValidationResult result = repIntegrationService.validateAfdFile(file);
        return ResponseEntity.ok(result);
    }
}
