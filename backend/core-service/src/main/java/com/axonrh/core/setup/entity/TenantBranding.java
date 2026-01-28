package com.axonrh.core.setup.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_branding", schema = "shared")
public class TenantBranding {

    @Id
    private UUID tenantId;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "logo_width")
    private Integer logoWidth = 150;

    @Column(name = "primary_color", length = 7)
    private String primaryColor = "#1976D2";

    @Column(name = "secondary_color", length = 7)
    private String secondaryColor = "#424242";

    @Column(name = "accent_color", length = 7)
    private String accentColor = "#FF4081";

    @Column(name = "font_family", length = 100)
    private String fontFamily = "Plus Jakarta Sans";

    @Column(name = "base_font_size")
    private Integer baseFontSize = 16;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (primaryColor == null) primaryColor = "#1976D2";
        if (secondaryColor == null) secondaryColor = "#424242";
        if (fontFamily == null) fontFamily = "Plus Jakarta Sans";
        if (baseFontSize == null) baseFontSize = 16;
        if (logoWidth == null) logoWidth = 150;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public Integer getLogoWidth() { return logoWidth; }
    public void setLogoWidth(Integer logoWidth) { this.logoWidth = logoWidth; }

    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }

    public String getSecondaryColor() { return secondaryColor; }
    public void setSecondaryColor(String secondaryColor) { this.secondaryColor = secondaryColor; }

    public String getAccentColor() { return accentColor; }
    public void setAccentColor(String accentColor) { this.accentColor = accentColor; }

    public String getFontFamily() { return fontFamily; }
    public void setFontFamily(String fontFamily) { this.fontFamily = fontFamily; }

    public Integer getBaseFontSize() { return baseFontSize; }
    public void setBaseFontSize(Integer baseFontSize) { this.baseFontSize = baseFontSize; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
