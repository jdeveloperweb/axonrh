package com.axonrh.config.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * DTO de resposta com configuracao de tema completa.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ThemeConfigResponse {

    private UUID id;
    private UUID tenantId;

    // ==================== Identidade Visual ====================

    private String logoUrl;
    private String logoDarkUrl;
    private String faviconUrl;

    // ==================== Cores do Tema Claro ====================

    private String primaryColor;
    private String secondaryColor;
    private String accentColor;
    private String backgroundColor;
    private String surfaceColor;
    private String textPrimaryColor;
    private String textSecondaryColor;

    // ==================== Cores do Tema Escuro ====================

    private String darkPrimaryColor;
    private String darkSecondaryColor;
    private String darkBackgroundColor;
    private String darkSurfaceColor;
    private String darkTextPrimaryColor;
    private String darkTextSecondaryColor;

    // ==================== Configuracoes de Login ====================

    private String loginBackgroundUrl;
    private String loginWelcomeMessage;
    private String loginFooterText;
    private Boolean showPoweredBy;

    // ==================== CSS ====================

    private String customCss;
    private String generatedCss;

    // ==================== Extras ====================

    private Map<String, Object> extraSettings;

    // ==================== Versionamento ====================

    private Integer version;
    private LocalDateTime publishedAt;
    private Boolean isActive;

    // ==================== Auditoria ====================

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
