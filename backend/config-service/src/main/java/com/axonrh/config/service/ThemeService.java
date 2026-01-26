package com.axonrh.config.service;

import com.axonrh.config.config.CacheConfig;
import com.axonrh.config.dto.CssVariablesResponse;
import com.axonrh.config.dto.ThemeConfigRequest;
import com.axonrh.config.dto.ThemeConfigResponse;
import com.axonrh.config.entity.ConfigVersion;
import com.axonrh.config.entity.TenantConfig;
import com.axonrh.config.exception.ConfigNotFoundException;
import com.axonrh.config.exception.InvalidColorException;
import com.axonrh.config.repository.ConfigVersionRepository;
import com.axonrh.config.repository.TenantConfigRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Servico para gestao de temas e identidade visual.
 * Implementa cache com Redis para performance.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ThemeService {

    private final TenantConfigRepository configRepository;
    private final ConfigVersionRepository versionRepository;
    private final ObjectMapper objectMapper;

    @Value("${config.theme.validation.min-contrast-ratio:4.5}")
    private double minContrastRatio;

    @Value("${config.versioning.max-versions:10}")
    private int maxVersions;

    /**
     * Busca configuracao de tema por tenant com cache.
     */
    @Cacheable(value = CacheConfig.THEME_CACHE, key = "#tenantId")
    @Transactional(readOnly = true)
    public ThemeConfigResponse getThemeConfig(UUID tenantId) {
        log.debug("Buscando configuracao de tema para tenant: {}", tenantId);

        TenantConfig config = configRepository.findByTenantIdAndIsActiveTrue(tenantId)
                .orElseThrow(() -> new ConfigNotFoundException("Configuracao nao encontrada para tenant: " + tenantId));

        return mapToResponse(config);
    }

    /**
     * Busca ou cria configuracao de tema.
     */
    @Transactional
    public ThemeConfigResponse getOrCreateThemeConfig(UUID tenantId) {
        return configRepository.findByTenantIdAndIsActiveTrue(tenantId)
                .map(this::mapToResponse)
                .orElseGet(() -> createDefaultConfig(tenantId));
    }

    /**
     * Atualiza configuracao de tema com validacao e versionamento.
     */
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.THEME_CACHE, key = "#tenantId"),
            @CacheEvict(value = CacheConfig.CSS_CACHE, key = "#tenantId")
    })
    @Transactional
    public ThemeConfigResponse updateThemeConfig(UUID tenantId, ThemeConfigRequest request, UUID userId) {
        log.info("Atualizando configuracao de tema para tenant: {}", tenantId);

        // Valida cores se fornecidas
        validateColors(request);

        // Busca ou cria configuracao
        TenantConfig config = configRepository.findByTenantId(tenantId)
                .orElseGet(() -> createNewConfig(tenantId));

        // Salva versao anterior
        saveVersionSnapshot(config, request.getChangeDescription(), userId);

        // Aplica atualizacoes
        applyUpdates(config, request);
        config.incrementVersion();
        config.setUpdatedBy(userId);
        config.setPublishedAt(LocalDateTime.now());

        TenantConfig saved = configRepository.save(config);
        log.info("Configuracao atualizada - tenant: {}, versao: {}", tenantId, saved.getVersion());

        // Limpa versoes antigas
        cleanupOldVersions(tenantId);

        return mapToResponse(saved);
    }

    /**
     * Gera CSS com variaveis customizadas.
     */
    @Cacheable(value = CacheConfig.CSS_CACHE, key = "#tenantId")
    @Transactional(readOnly = true)
    public CssVariablesResponse generateCssVariables(UUID tenantId) {
        log.debug("Gerando CSS para tenant: {}", tenantId);

        TenantConfig config = configRepository.findByTenantIdAndIsActiveTrue(tenantId)
                .orElseThrow(() -> new ConfigNotFoundException("Configuracao nao encontrada para tenant: " + tenantId));

        Map<String, String> lightTheme = buildLightThemeVariables(config);
        Map<String, String> darkTheme = buildDarkThemeVariables(config);
        Map<String, String> highContrastTheme = buildHighContrastVariables(config);

        String cssContent = generateCssContent(lightTheme, darkTheme, highContrastTheme, config.getCustomCss());

        return CssVariablesResponse.builder()
                .cssContent(cssContent)
                .lightTheme(lightTheme)
                .darkTheme(darkTheme)
                .highContrastTheme(highContrastTheme)
                .version(config.getVersion())
                .cacheKey("css-" + tenantId + "-v" + config.getVersion())
                .build();
    }

    /**
     * Restaura versao anterior da configuracao.
     */
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.THEME_CACHE, key = "#tenantId"),
            @CacheEvict(value = CacheConfig.CSS_CACHE, key = "#tenantId")
    })
    @Transactional
    public ThemeConfigResponse rollbackToVersion(UUID tenantId, Integer targetVersion, UUID userId) {
        log.info("Rollback de configuracao - tenant: {}, versao destino: {}", tenantId, targetVersion);

        ConfigVersion snapshot = versionRepository.findByTenantIdAndVersion(tenantId, targetVersion)
                .orElseThrow(() -> new ConfigNotFoundException("Versao " + targetVersion + " nao encontrada"));

        TenantConfig config = configRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ConfigNotFoundException("Configuracao nao encontrada"));

        // Salva versao atual antes do rollback
        saveVersionSnapshot(config, "Rollback para versao " + targetVersion, userId);

        // Restaura do snapshot
        restoreFromSnapshot(config, snapshot.getConfigSnapshot());
        config.incrementVersion();
        config.setUpdatedBy(userId);
        config.setPublishedAt(LocalDateTime.now());

        TenantConfig saved = configRepository.save(config);
        log.info("Rollback concluido - nova versao: {}", saved.getVersion());

        return mapToResponse(saved);
    }

    /**
     * Valida contraste entre cores.
     */
    public boolean validateContrast(String foreground, String background) {
        try {
            Color fg = Color.decode(foreground);
            Color bg = Color.decode(background);

            double ratio = calculateContrastRatio(fg, bg);
            return ratio >= minContrastRatio;
        } catch (Exception e) {
            log.warn("Erro ao validar contraste: {}", e.getMessage());
            return false;
        }
    }

    // ==================== Metodos Privados ====================

    private void validateColors(ThemeConfigRequest request) {
        if (request.getPrimaryColor() != null && request.getBackgroundColor() != null) {
            if (!validateContrast(request.getPrimaryColor(), request.getBackgroundColor())) {
                log.warn("Contraste insuficiente entre cor primaria e fundo");
            }
        }

        if (request.getTextPrimaryColor() != null && request.getBackgroundColor() != null) {
            if (!validateContrast(request.getTextPrimaryColor(), request.getBackgroundColor())) {
                throw new InvalidColorException("Contraste insuficiente entre texto e fundo. Ratio minimo: " + minContrastRatio);
            }
        }
    }

    private double calculateContrastRatio(Color fg, Color bg) {
        double l1 = calculateRelativeLuminance(fg);
        double l2 = calculateRelativeLuminance(bg);

        double lighter = Math.max(l1, l2);
        double darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    private double calculateRelativeLuminance(Color color) {
        double r = adjustGamma(color.getRed() / 255.0);
        double g = adjustGamma(color.getGreen() / 255.0);
        double b = adjustGamma(color.getBlue() / 255.0);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    private double adjustGamma(double value) {
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    }

    private ThemeConfigResponse createDefaultConfig(UUID tenantId) {
        TenantConfig config = createNewConfig(tenantId);
        TenantConfig saved = configRepository.save(config);
        return mapToResponse(saved);
    }

    private TenantConfig createNewConfig(UUID tenantId) {
        return TenantConfig.builder()
                .tenantId(tenantId)
                .primaryColor("#1976D2")
                .secondaryColor("#424242")
                .accentColor("#FF4081")
                .backgroundColor("#FFFFFF")
                .surfaceColor("#FAFAFA")
                .textPrimaryColor("#212121")
                .textSecondaryColor("#757575")
                .showPoweredBy(true)
                .version(1)
                .isActive(true)
                .build();
    }

    private void applyUpdates(TenantConfig config, ThemeConfigRequest request) {
        if (request.getPrimaryColor() != null) config.setPrimaryColor(request.getPrimaryColor());
        if (request.getSecondaryColor() != null) config.setSecondaryColor(request.getSecondaryColor());
        if (request.getAccentColor() != null) config.setAccentColor(request.getAccentColor());
        if (request.getBackgroundColor() != null) config.setBackgroundColor(request.getBackgroundColor());
        if (request.getSurfaceColor() != null) config.setSurfaceColor(request.getSurfaceColor());
        if (request.getTextPrimaryColor() != null) config.setTextPrimaryColor(request.getTextPrimaryColor());
        if (request.getTextSecondaryColor() != null) config.setTextSecondaryColor(request.getTextSecondaryColor());

        // Tema escuro
        if (request.getDarkPrimaryColor() != null) config.setDarkPrimaryColor(request.getDarkPrimaryColor());
        if (request.getDarkSecondaryColor() != null) config.setDarkSecondaryColor(request.getDarkSecondaryColor());
        if (request.getDarkBackgroundColor() != null) config.setDarkBackgroundColor(request.getDarkBackgroundColor());
        if (request.getDarkSurfaceColor() != null) config.setDarkSurfaceColor(request.getDarkSurfaceColor());
        if (request.getDarkTextPrimaryColor() != null) config.setDarkTextPrimaryColor(request.getDarkTextPrimaryColor());
        if (request.getDarkTextSecondaryColor() != null) config.setDarkTextSecondaryColor(request.getDarkTextSecondaryColor());

        // Login
        if (request.getLoginWelcomeMessage() != null) config.setLoginWelcomeMessage(request.getLoginWelcomeMessage());
        if (request.getLoginFooterText() != null) config.setLoginFooterText(request.getLoginFooterText());
        if (request.getShowPoweredBy() != null) config.setShowPoweredBy(request.getShowPoweredBy());

        // CSS e extras
        if (request.getCustomCss() != null) config.setCustomCss(request.getCustomCss());
        if (request.getExtraSettings() != null) config.setExtraSettings(request.getExtraSettings());
    }

    private void saveVersionSnapshot(TenantConfig config, String description, UUID userId) {
        try {
            Map<String, Object> snapshot = objectMapper.convertValue(config, new TypeReference<>() {});

            ConfigVersion version = ConfigVersion.builder()
                    .tenantId(config.getTenantId())
                    .version(config.getVersion())
                    .configSnapshot(snapshot)
                    .changeDescription(description)
                    .createdBy(userId)
                    .build();

            versionRepository.save(version);
        } catch (Exception e) {
            log.error("Erro ao salvar snapshot de versao: {}", e.getMessage());
        }
    }

    private void restoreFromSnapshot(TenantConfig config, Map<String, Object> snapshot) {
        if (snapshot.get("primaryColor") != null) config.setPrimaryColor((String) snapshot.get("primaryColor"));
        if (snapshot.get("secondaryColor") != null) config.setSecondaryColor((String) snapshot.get("secondaryColor"));
        if (snapshot.get("accentColor") != null) config.setAccentColor((String) snapshot.get("accentColor"));
        if (snapshot.get("backgroundColor") != null) config.setBackgroundColor((String) snapshot.get("backgroundColor"));
        if (snapshot.get("surfaceColor") != null) config.setSurfaceColor((String) snapshot.get("surfaceColor"));
        if (snapshot.get("textPrimaryColor") != null) config.setTextPrimaryColor((String) snapshot.get("textPrimaryColor"));
        if (snapshot.get("textSecondaryColor") != null) config.setTextSecondaryColor((String) snapshot.get("textSecondaryColor"));
        if (snapshot.get("customCss") != null) config.setCustomCss((String) snapshot.get("customCss"));
    }

    private void cleanupOldVersions(UUID tenantId) {
        long count = versionRepository.countByTenantId(tenantId);
        if (count > maxVersions) {
            Integer minVersion = versionRepository.findMaxVersionByTenantId(tenantId)
                    .map(max -> max - maxVersions + 1)
                    .orElse(1);
            versionRepository.deleteOldVersions(tenantId, minVersion);
            log.debug("Versoes antigas removidas para tenant: {}", tenantId);
        }
    }

    private Map<String, String> buildLightThemeVariables(TenantConfig config) {
        Map<String, String> vars = new LinkedHashMap<>();
        vars.put("--color-primary", config.getPrimaryColor());
        vars.put("--color-secondary", config.getSecondaryColor());
        vars.put("--color-accent", config.getAccentColor());
        vars.put("--color-background", config.getBackgroundColor());
        vars.put("--color-surface", config.getSurfaceColor());
        vars.put("--color-text-primary", config.getTextPrimaryColor());
        vars.put("--color-text-secondary", config.getTextSecondaryColor());
        return vars;
    }

    private Map<String, String> buildDarkThemeVariables(TenantConfig config) {
        Map<String, String> vars = new LinkedHashMap<>();
        vars.put("--color-primary", config.getDarkPrimaryColor() != null ? config.getDarkPrimaryColor() : config.getPrimaryColor());
        vars.put("--color-secondary", config.getDarkSecondaryColor() != null ? config.getDarkSecondaryColor() : config.getSecondaryColor());
        vars.put("--color-accent", config.getAccentColor());
        vars.put("--color-background", config.getDarkBackgroundColor() != null ? config.getDarkBackgroundColor() : "#121212");
        vars.put("--color-surface", config.getDarkSurfaceColor() != null ? config.getDarkSurfaceColor() : "#1E1E1E");
        vars.put("--color-text-primary", config.getDarkTextPrimaryColor() != null ? config.getDarkTextPrimaryColor() : "#FFFFFF");
        vars.put("--color-text-secondary", config.getDarkTextSecondaryColor() != null ? config.getDarkTextSecondaryColor() : "#B0B0B0");
        return vars;
    }

    private Map<String, String> buildHighContrastVariables(TenantConfig config) {
        Map<String, String> vars = new LinkedHashMap<>();
        vars.put("--color-primary", "#FFFF00");
        vars.put("--color-secondary", "#00FFFF");
        vars.put("--color-accent", "#FF00FF");
        vars.put("--color-background", "#000000");
        vars.put("--color-surface", "#000000");
        vars.put("--color-text-primary", "#FFFFFF");
        vars.put("--color-text-secondary", "#FFFF00");
        return vars;
    }

    private String generateCssContent(Map<String, String> light, Map<String, String> dark,
                                      Map<String, String> highContrast, String customCss) {
        StringBuilder css = new StringBuilder();

        // Tema claro (padrao)
        css.append(":root {\n");
        light.forEach((key, value) -> css.append("  ").append(key).append(": ").append(value).append(";\n"));
        css.append("}\n\n");

        // Tema escuro
        css.append("@media (prefers-color-scheme: dark) {\n");
        css.append("  :root {\n");
        dark.forEach((key, value) -> css.append("    ").append(key).append(": ").append(value).append(";\n"));
        css.append("  }\n");
        css.append("}\n\n");

        // Classe para forcar tema escuro
        css.append(".dark-theme {\n");
        dark.forEach((key, value) -> css.append("  ").append(key).append(": ").append(value).append(";\n"));
        css.append("}\n\n");

        // Alto contraste
        css.append(".high-contrast {\n");
        highContrast.forEach((key, value) -> css.append("  ").append(key).append(": ").append(value).append(";\n"));
        css.append("}\n");

        // CSS customizado
        if (customCss != null && !customCss.isBlank()) {
            css.append("\n/* Custom CSS */\n");
            css.append(customCss);
        }

        return css.toString();
    }

    private ThemeConfigResponse mapToResponse(TenantConfig config) {
        return ThemeConfigResponse.builder()
                .id(config.getId())
                .tenantId(config.getTenantId())
                .logoUrl(config.getLogoUrl())
                .logoDarkUrl(config.getLogoDarkUrl())
                .faviconUrl(config.getFaviconUrl())
                .primaryColor(config.getPrimaryColor())
                .secondaryColor(config.getSecondaryColor())
                .accentColor(config.getAccentColor())
                .backgroundColor(config.getBackgroundColor())
                .surfaceColor(config.getSurfaceColor())
                .textPrimaryColor(config.getTextPrimaryColor())
                .textSecondaryColor(config.getTextSecondaryColor())
                .darkPrimaryColor(config.getDarkPrimaryColor())
                .darkSecondaryColor(config.getDarkSecondaryColor())
                .darkBackgroundColor(config.getDarkBackgroundColor())
                .darkSurfaceColor(config.getDarkSurfaceColor())
                .darkTextPrimaryColor(config.getDarkTextPrimaryColor())
                .darkTextSecondaryColor(config.getDarkTextSecondaryColor())
                .loginBackgroundUrl(config.getLoginBackgroundUrl())
                .loginWelcomeMessage(config.getLoginWelcomeMessage())
                .loginFooterText(config.getLoginFooterText())
                .showPoweredBy(config.getShowPoweredBy())
                .customCss(config.getCustomCss())
                .extraSettings(config.getExtraSettings())
                .version(config.getVersion())
                .publishedAt(config.getPublishedAt())
                .isActive(config.getIsActive())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
