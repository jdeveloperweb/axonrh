package com.axonrh.auth.controller;

import com.axonrh.auth.dto.MfaCodeRequest;
import com.axonrh.auth.dto.MfaSetupResponse;
import com.axonrh.auth.service.MfaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth/mfa")
@RequiredArgsConstructor
@Tag(name = "MFA", description = "Endpoints para gestão de Multi-Factor Authentication")
public class MfaController {

    private final MfaService mfaService;

    @GetMapping("/setup")
    @Operation(summary = "Configurar MFA", description = "Inicia o processo de configuração do MFA e retorna o segredo e a URL do QR Code")
    public ResponseEntity<MfaSetupResponse> setupMfa(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(mfaService.setupMfa(UUID.fromString(userId)));
    }

    @PostMapping("/enable")
    @Operation(summary = "Ativar MFA", description = "Valida o código e ativa o MFA para o usuário")
    public ResponseEntity<Void> enableMfa(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody com.axonrh.auth.dto.MfaEnableRequest request) {
        mfaService.enableMfa(UUID.fromString(userId), request.getSecret(), request.getCode());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/disable")
    @Operation(summary = "Desativar MFA", description = "Valida o código e desativa o MFA para o usuário")
    public ResponseEntity<Void> disableMfa(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody MfaCodeRequest request) {
        mfaService.disableMfa(UUID.fromString(userId), request.getCode());
        return ResponseEntity.ok().build();
    }
}
