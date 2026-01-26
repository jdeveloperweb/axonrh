package com.axonrh.config.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Entidade de configuracao de tenant (white-label).
 * Armazena identidade visual, configuracoes de login e preferencias.
 */
@Entity
@Table(name = "tenant_configs", schema = "shared")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    // ==================== Identidade Visual ====================

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "logo_dark_url", length = 500)
    private String logoDarkUrl;

    @Column(name = "favicon_url", length = 500)
    private String faviconUrl;

    @Column(name = "primary_color", length = 7)
    @Builder.Default
    private String primaryColor = "#1976D2";

    @Column(name = "secondary_color", length = 7)
    @Builder.Default
    private String secondaryColor = "#424242";

    @Column(name = "accent_color", length = 7)
    @Builder.Default
    private String accentColor = "#FF4081";

    @Column(name = "background_color", length = 7)
    @Builder.Default
    private String backgroundColor = "#FFFFFF";

    @Column(name = "surface_color", length = 7)
    @Builder.Default
    private String surfaceColor = "#FAFAFA";

    @Column(name = "text_primary_color", length = 7)
    @Builder.Default
    private String textPrimaryColor = "#212121";

    @Column(name = "text_secondary_color", length = 7)
    @Builder.Default
    private String textSecondaryColor = "#757575";

    // ==================== Tema Escuro ====================

    @Column(name = "dark_primary_color", length = 7)
    private String darkPrimaryColor;

    @Column(name = "dark_secondary_color", length = 7)
    private String darkSecondaryColor;

    @Column(name = "dark_background_color", length = 7)
    private String darkBackgroundColor;

    @Column(name = "dark_surface_color", length = 7)
    private String darkSurfaceColor;

    @Column(name = "dark_text_primary_color", length = 7)
    private String darkTextPrimaryColor;

    @Column(name = "dark_text_secondary_color", length = 7)
    private String darkTextSecondaryColor;

    // ==================== Configuracao de Login ====================

    @Column(name = "login_background_url", length = 500)
    private String loginBackgroundUrl;

    @Column(name = "login_welcome_message", length = 500)
    private String loginWelcomeMessage;

    @Column(name = "login_footer_text", length = 255)
    private String loginFooterText;

    @Column(name = "show_powered_by")
    @Builder.Default
    private Boolean showPoweredBy = true;

    @Column(name = "custom_css", columnDefinition = "TEXT")
    private String customCss;

    // ==================== Configuracoes Adicionais ====================

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extra_settings", columnDefinition = "jsonb")
    private Map<String, Object> extraSettings;

    // ==================== Versionamento ====================

    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    // ==================== Auditoria ====================

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Incrementa a versao da configuracao.
     */
    public void incrementVersion() {
        this.version = (this.version == null ? 0 : this.version) + 1;
    }

    /**
     * Verifica se tem tema escuro configurado.
     */
    public boolean hasDarkTheme() {
        return darkPrimaryColor != null && darkBackgroundColor != null;
    }
}
