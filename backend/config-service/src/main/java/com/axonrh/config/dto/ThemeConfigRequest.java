package com.axonrh.config.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.Map;

/**
 * DTO para requisicao de configuracao de tema.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThemeConfigRequest {
    
    // ==================== Logos e Imagens ====================
    private String logoUrl;
    private String logoDarkUrl;
    private String faviconUrl;
    private String loginBackgroundUrl;


    // ==================== Cores do Tema Claro ====================

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor primaria deve estar no formato hexadecimal (#RRGGBB)")
    private String primaryColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor secundaria deve estar no formato hexadecimal (#RRGGBB)")
    private String secondaryColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor de destaque deve estar no formato hexadecimal (#RRGGBB)")
    private String accentColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor de fundo deve estar no formato hexadecimal (#RRGGBB)")
    private String backgroundColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor de superficie deve estar no formato hexadecimal (#RRGGBB)")
    private String surfaceColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor do texto primario deve estar no formato hexadecimal (#RRGGBB)")
    private String textPrimaryColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor do texto secundario deve estar no formato hexadecimal (#RRGGBB)")
    private String textSecondaryColor;

    // ==================== Cores do Tema Escuro ====================

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor primaria escura deve estar no formato hexadecimal (#RRGGBB)")
    private String darkPrimaryColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor secundaria escura deve estar no formato hexadecimal (#RRGGBB)")
    private String darkSecondaryColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor de fundo escura deve estar no formato hexadecimal (#RRGGBB)")
    private String darkBackgroundColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor de superficie escura deve estar no formato hexadecimal (#RRGGBB)")
    private String darkSurfaceColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor do texto primario escuro deve estar no formato hexadecimal (#RRGGBB)")
    private String darkTextPrimaryColor;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor do texto secundario escuro deve estar no formato hexadecimal (#RRGGBB)")
    private String darkTextSecondaryColor;

    // ==================== Configuracoes de Login ====================

    @Size(max = 500, message = "Mensagem de boas-vindas deve ter no maximo 500 caracteres")
    private String loginWelcomeMessage;

    @Size(max = 255, message = "Texto do rodape deve ter no maximo 255 caracteres")
    private String loginFooterText;

    private Boolean showPoweredBy;

    // ==================== CSS Customizado ====================

    @Size(max = 10000, message = "CSS customizado deve ter no maximo 10000 caracteres")
    private String customCss;

    // ==================== Configuracoes Extras ====================

    private Map<String, Object> extraSettings;

    // ==================== Descricao da Mudanca ====================

    @Size(max = 500, message = "Descricao da mudanca deve ter no maximo 500 caracteres")
    private String changeDescription;
}
