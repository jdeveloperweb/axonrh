package com.axonrh.config.controller;

import com.axonrh.config.dto.*;
import com.axonrh.config.service.LogoService;
import com.axonrh.config.service.ThemeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Controller REST para configuracoes de tenant (white-label).
 * Endpoints para gestao de temas, logos e identidade visual.
 */
@RestController
@RequestMapping("/api/v1/config")
@RequiredArgsConstructor
@Slf4j
public class ConfigController {

    private final ThemeService themeService;
    private final LogoService logoService;

    // ==================== Tema ====================

    /**
     * Busca configuracao de tema do tenant.
     */
    @GetMapping("/theme/{tenantId}")
    public ResponseEntity<ThemeConfigResponse> getThemeConfig(@PathVariable UUID tenantId) {
        log.debug("GET /theme/{}", tenantId);
        ThemeConfigResponse response = themeService.getOrCreateThemeConfig(tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Atualiza configuracao de tema.
     */
    @PutMapping("/theme/{tenantId}")
    public ResponseEntity<ThemeConfigResponse> updateThemeConfig(
            @PathVariable UUID tenantId,
            @Valid @RequestBody ThemeConfigRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        log.info("PUT /theme/{} by user {}", tenantId, userId);
        ThemeConfigResponse response = themeService.updateThemeConfig(tenantId, request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Gera CSS com variaveis customizadas.
     */
    @GetMapping(value = "/theme/{tenantId}/css", produces = "text/css")
    public ResponseEntity<String> getCssVariables(@PathVariable UUID tenantId) {
        log.debug("GET /theme/{}/css", tenantId);
        CssVariablesResponse response = themeService.generateCssVariables(tenantId);
        return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=86400")
                .header("ETag", response.getCacheKey())
                .body(response.getCssContent());
    }

    /**
     * Busca variaveis CSS como JSON.
     */
    @GetMapping("/theme/{tenantId}/variables")
    public ResponseEntity<CssVariablesResponse> getCssVariablesJson(@PathVariable UUID tenantId) {
        log.debug("GET /theme/{}/variables", tenantId);
        CssVariablesResponse response = themeService.generateCssVariables(tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Valida contraste entre duas cores.
     */
    @GetMapping("/theme/validate-contrast")
    public ResponseEntity<ContrastValidationResponse> validateContrast(
            @RequestParam String foreground,
            @RequestParam String background) {
        boolean isValid = themeService.validateContrast(foreground, background);
        return ResponseEntity.ok(new ContrastValidationResponse(isValid, foreground, background));
    }

    // ==================== Versionamento ====================

    /**
     * Restaura versao anterior da configuracao.
     */
    @PostMapping("/theme/{tenantId}/rollback/{version}")
    public ResponseEntity<ThemeConfigResponse> rollbackToVersion(
            @PathVariable UUID tenantId,
            @PathVariable Integer version,
            @RequestHeader("X-User-Id") UUID userId) {
        log.info("POST /theme/{}/rollback/{} by user {}", tenantId, version, userId);
        ThemeConfigResponse response = themeService.rollbackToVersion(tenantId, version, userId);
        return ResponseEntity.ok(response);
    }

    // ==================== Logos ====================

    /**
     * Upload de logo principal.
     */
    @PostMapping(value = "/logo/{tenantId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LogoUploadResponse> uploadLogo(
            @PathVariable UUID tenantId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") UUID userId) {
        log.info("POST /logo/{} - file: {}", tenantId, file.getOriginalFilename());
        LogoUploadResponse response = logoService.uploadLogo(tenantId, file, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Upload de logo para tema escuro.
     */
    @PostMapping(value = "/logo/{tenantId}/dark", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LogoUploadResponse> uploadLogoDark(
            @PathVariable UUID tenantId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") UUID userId) {
        log.info("POST /logo/{}/dark - file: {}", tenantId, file.getOriginalFilename());
        LogoUploadResponse response = logoService.uploadLogoDark(tenantId, file, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Upload de favicon.
     */
    @PostMapping(value = "/favicon/{tenantId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LogoUploadResponse> uploadFavicon(
            @PathVariable UUID tenantId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") UUID userId) {
        log.info("POST /favicon/{} - file: {}", tenantId, file.getOriginalFilename());
        LogoUploadResponse response = logoService.uploadFavicon(tenantId, file, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Upload de imagem de fundo da tela de login.
     */
    @PostMapping(value = "/login-background/{tenantId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LogoUploadResponse> uploadLoginBackground(
            @PathVariable UUID tenantId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") UUID userId) {
        log.info("POST /login-background/{} - file: {}", tenantId, file.getOriginalFilename());
        LogoUploadResponse response = logoService.uploadLoginBackground(tenantId, file, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Busca URL do logo.
     */
    @GetMapping("/logo/{tenantId}")
    public ResponseEntity<LogoUrlResponse> getLogoUrl(@PathVariable UUID tenantId) {
        String url = logoService.getLogoUrl(tenantId);
        return ResponseEntity.ok(new LogoUrlResponse(tenantId, url));
    }

    /**
     * Serve a imagem do logo diretamente (necessário para acesso público sem MinIO público).
     */
    @GetMapping(value = "/logos/{tenantId}/{filename}", produces = {MediaType.IMAGE_PNG_VALUE, MediaType.IMAGE_JPEG_VALUE, "image/svg+xml"})
    public ResponseEntity<byte[]> getLogoFile(@PathVariable UUID tenantId, @PathVariable String filename) {
        String objectName = tenantId + "/" + filename;
        byte[] bytes = logoService.getLogoBytes(objectName);
        if (bytes == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=86400")
                .body(bytes);
    }

    /**
     * Remove logo.
     */
    @DeleteMapping("/logo/{tenantId}")
    public ResponseEntity<Void> deleteLogo(
            @PathVariable UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId) {
        log.info("DELETE /logo/{} by user {}", tenantId, userId);
        logoService.deleteLogo(tenantId, userId);
        return ResponseEntity.noContent().build();
    }

    // ==================== DTOs Internos ====================

    public record ContrastValidationResponse(boolean valid, String foreground, String background) {}
    public record LogoUrlResponse(UUID tenantId, String logoUrl) {}
}
