package com.axonrh.auth.controller;

import com.axonrh.auth.dto.LoginResponse;
import com.axonrh.auth.dto.MfaCodeRequest;
import com.axonrh.auth.dto.MfaSetupCompleteRequest;
import com.axonrh.auth.dto.MfaSetupResponse;
import com.axonrh.auth.service.AuthService;
import com.axonrh.auth.service.MfaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth/mfa")
@RequiredArgsConstructor
@Tag(name = "MFA", description = "Endpoints para gestão de Multi-Factor Authentication")
public class MfaController {

    private final MfaService mfaService;
    private final AuthService authService;

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

    /**
     * Endpoint público: conclui a configuração obrigatória de MFA e retorna sessão completa.
     */
    @PostMapping("/complete-mandatory-setup")
    @Operation(
        summary = "Concluir configuração obrigatória de MFA",
        description = "Valida o código TOTP e ativa o MFA, retornando tokens de acesso para o usuário"
    )
    public ResponseEntity<LoginResponse> completeMandatorySetup(
            @Valid @RequestBody MfaSetupCompleteRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        LoginResponse response = authService.completeMandatoryMfaSetup(
                request.getSetupToken(), request.getCode(), ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint público: reenvia o email de configuração MFA.
     */
    @PostMapping("/resend-setup-email")
    @Operation(
        summary = "Reenviar email de configuração MFA",
        description = "Reenvia o email com o QR Code para configuração do MFA"
    )
    public ResponseEntity<Map<String, String>> resendSetupEmail(
            @RequestBody Map<String, String> body) {
        String setupToken = body.get("setupToken");
        if (setupToken == null || setupToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "setupToken é obrigatório"));
        }
        mfaService.resendSetupEmail(setupToken);
        return ResponseEntity.ok(Map.of("message", "Email reenviado com sucesso"));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
