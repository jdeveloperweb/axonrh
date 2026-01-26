package com.axonrh.config.service;

import com.axonrh.config.dto.CssVariablesResponse;
import com.axonrh.config.dto.ThemeConfigRequest;
import com.axonrh.config.dto.ThemeConfigResponse;
import com.axonrh.config.entity.ConfigVersion;
import com.axonrh.config.entity.TenantConfig;
import com.axonrh.config.exception.ConfigNotFoundException;
import com.axonrh.config.exception.InvalidColorException;
import com.axonrh.config.repository.ConfigVersionRepository;
import com.axonrh.config.repository.TenantConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Testes unitarios do ThemeService.
 * Casos de teste TDD conforme especificacao (T062-T065).
 */
@ExtendWith(MockitoExtension.class)
class ThemeServiceTest {

    @Mock
    private TenantConfigRepository configRepository;

    @Mock
    private ConfigVersionRepository versionRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ThemeService themeService;

    private UUID tenantId;
    private UUID userId;
    private TenantConfig testConfig;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(themeService, "minContrastRatio", 4.5);
        ReflectionTestUtils.setField(themeService, "maxVersions", 10);

        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();

        testConfig = TenantConfig.builder()
                .id(UUID.randomUUID())
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

    // ==================== T062: Upload e validacao de logo ====================

    @Nested
    @DisplayName("T062: Upload e Validacao de Logo")
    class LogoUploadTests {

        // Nota: Testes de upload estao em LogoServiceTest
        // Aqui testamos apenas a integracao com ThemeService

        @Test
        @DisplayName("Configuracao deve armazenar URL do logo")
        void shouldStoreLogoUrl() {
            // Given
            testConfig.setLogoUrl("http://minio:9000/logos/tenant123/logo.png");

            when(configRepository.findByTenantIdAndIsActiveTrue(tenantId))
                    .thenReturn(Optional.of(testConfig));

            // When
            ThemeConfigResponse response = themeService.getThemeConfig(tenantId);

            // Then
            assertThat(response.getLogoUrl()).isEqualTo("http://minio:9000/logos/tenant123/logo.png");
        }

        @Test
        @DisplayName("Deve suportar logo para tema escuro separado")
        void shouldSupportDarkThemeLogo() {
            // Given
            testConfig.setLogoUrl("http://minio:9000/logos/logo-light.png");
            testConfig.setLogoDarkUrl("http://minio:9000/logos/logo-dark.png");

            when(configRepository.findByTenantIdAndIsActiveTrue(tenantId))
                    .thenReturn(Optional.of(testConfig));

            // When
            ThemeConfigResponse response = themeService.getThemeConfig(tenantId);

            // Then
            assertThat(response.getLogoUrl()).contains("logo-light.png");
            assertThat(response.getLogoDarkUrl()).contains("logo-dark.png");
        }
    }

    // ==================== T063: Paleta de cores com validacao ====================

    @Nested
    @DisplayName("T063: Paleta de Cores com Validacao")
    class ColorPaletteTests {

        @Test
        @DisplayName("Deve aceitar cores em formato hexadecimal valido")
        void shouldAcceptValidHexColors() {
            // Given
            ThemeConfigRequest request = ThemeConfigRequest.builder()
                    .primaryColor("#1976D2")
                    .secondaryColor("#424242")
                    .backgroundColor("#FFFFFF")
                    .textPrimaryColor("#212121")
                    .build();

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            ThemeConfigResponse response = themeService.updateThemeConfig(tenantId, request, userId);

            // Then
            assertThat(response.getPrimaryColor()).isEqualTo("#1976D2");
            assertThat(response.getSecondaryColor()).isEqualTo("#424242");
        }

        @Test
        @DisplayName("Deve validar contraste minimo entre texto e fundo")
        void shouldValidateMinimumContrast() {
            // Given - cores com contraste insuficiente
            ThemeConfigRequest request = ThemeConfigRequest.builder()
                    .textPrimaryColor("#CCCCCC")  // Cinza claro
                    .backgroundColor("#FFFFFF")    // Branco
                    .build();

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));

            // When & Then
            assertThatThrownBy(() -> themeService.updateThemeConfig(tenantId, request, userId))
                    .isInstanceOf(InvalidColorException.class)
                    .hasMessageContaining("Contraste insuficiente");
        }

        @Test
        @DisplayName("Deve aceitar cores com contraste adequado (>= 4.5:1)")
        void shouldAcceptAdequateContrast() {
            // Given - cores com bom contraste
            ThemeConfigRequest request = ThemeConfigRequest.builder()
                    .textPrimaryColor("#000000")  // Preto
                    .backgroundColor("#FFFFFF")    // Branco
                    .build();

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            ThemeConfigResponse response = themeService.updateThemeConfig(tenantId, request, userId);

            // Then
            assertThat(response.getTextPrimaryColor()).isEqualTo("#000000");
            assertThat(response.getBackgroundColor()).isEqualTo("#FFFFFF");
        }

        @Test
        @DisplayName("Metodo validateContrast deve retornar true para cores validas")
        void validateContrastShouldReturnTrueForValidColors() {
            // Given
            String foreground = "#000000"; // Preto
            String background = "#FFFFFF"; // Branco

            // When
            boolean result = themeService.validateContrast(foreground, background);

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Metodo validateContrast deve retornar false para contraste insuficiente")
        void validateContrastShouldReturnFalseForInvalidColors() {
            // Given
            String foreground = "#777777"; // Cinza medio
            String background = "#888888"; // Cinza similar

            // When
            boolean result = themeService.validateContrast(foreground, background);

            // Then
            assertThat(result).isFalse();
        }
    }

    // ==================== T064: Geracao de CSS dinamico ====================

    @Nested
    @DisplayName("T064: Geracao de CSS Dinamico")
    class CssGenerationTests {

        @Test
        @DisplayName("Deve gerar CSS com variaveis do tema claro")
        void shouldGenerateLightThemeCss() {
            // Given
            when(configRepository.findByTenantIdAndIsActiveTrue(tenantId))
                    .thenReturn(Optional.of(testConfig));

            // When
            CssVariablesResponse response = themeService.generateCssVariables(tenantId);

            // Then
            assertThat(response.getCssContent()).contains(":root {");
            assertThat(response.getCssContent()).contains("--color-primary: #1976D2");
            assertThat(response.getCssContent()).contains("--color-background: #FFFFFF");
            assertThat(response.getLightTheme()).containsEntry("--color-primary", "#1976D2");
        }

        @Test
        @DisplayName("Deve gerar CSS com tema escuro via media query")
        void shouldGenerateDarkThemeCss() {
            // Given
            testConfig.setDarkPrimaryColor("#90CAF9");
            testConfig.setDarkBackgroundColor("#121212");
            testConfig.setDarkSurfaceColor("#1E1E1E");

            when(configRepository.findByTenantIdAndIsActiveTrue(tenantId))
                    .thenReturn(Optional.of(testConfig));

            // When
            CssVariablesResponse response = themeService.generateCssVariables(tenantId);

            // Then
            assertThat(response.getCssContent()).contains("@media (prefers-color-scheme: dark)");
            assertThat(response.getCssContent()).contains("--color-background: #121212");
            assertThat(response.getDarkTheme()).containsEntry("--color-background", "#121212");
        }

        @Test
        @DisplayName("Deve gerar CSS com classe .dark-theme para forcamento manual")
        void shouldGenerateDarkThemeClass() {
            // Given
            testConfig.setDarkBackgroundColor("#121212");

            when(configRepository.findByTenantIdAndIsActiveTrue(tenantId))
                    .thenReturn(Optional.of(testConfig));

            // When
            CssVariablesResponse response = themeService.generateCssVariables(tenantId);

            // Then
            assertThat(response.getCssContent()).contains(".dark-theme {");
        }

        @Test
        @DisplayName("Deve gerar CSS com tema de alto contraste")
        void shouldGenerateHighContrastTheme() {
            // Given
            when(configRepository.findByTenantIdAndIsActiveTrue(tenantId))
                    .thenReturn(Optional.of(testConfig));

            // When
            CssVariablesResponse response = themeService.generateCssVariables(tenantId);

            // Then
            assertThat(response.getCssContent()).contains(".high-contrast {");
            assertThat(response.getHighContrastTheme()).containsEntry("--color-background", "#000000");
            assertThat(response.getHighContrastTheme()).containsEntry("--color-text-primary", "#FFFFFF");
        }

        @Test
        @DisplayName("Deve incluir CSS customizado no final")
        void shouldIncludeCustomCss() {
            // Given
            testConfig.setCustomCss(".custom-button { border-radius: 8px; }");

            when(configRepository.findByTenantIdAndIsActiveTrue(tenantId))
                    .thenReturn(Optional.of(testConfig));

            // When
            CssVariablesResponse response = themeService.generateCssVariables(tenantId);

            // Then
            assertThat(response.getCssContent()).contains("/* Custom CSS */");
            assertThat(response.getCssContent()).contains(".custom-button { border-radius: 8px; }");
        }

        @Test
        @DisplayName("Deve incluir versao e cache key na resposta")
        void shouldIncludeVersionAndCacheKey() {
            // Given
            testConfig.setVersion(5);

            when(configRepository.findByTenantIdAndIsActiveTrue(tenantId))
                    .thenReturn(Optional.of(testConfig));

            // When
            CssVariablesResponse response = themeService.generateCssVariables(tenantId);

            // Then
            assertThat(response.getVersion()).isEqualTo(5);
            assertThat(response.getCacheKey()).contains("v5");
        }
    }

    // ==================== T065: Versionamento de configuracoes ====================

    @Nested
    @DisplayName("T065: Versionamento de Configuracoes")
    class VersioningTests {

        @Test
        @DisplayName("Deve incrementar versao ao atualizar configuracao")
        void shouldIncrementVersionOnUpdate() {
            // Given
            testConfig.setVersion(3);
            ThemeConfigRequest request = ThemeConfigRequest.builder()
                    .primaryColor("#FF5722")
                    .changeDescription("Alteracao de cor primaria")
                    .build();

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(versionRepository.countByTenantId(tenantId)).thenReturn(3L);

            // When
            ThemeConfigResponse response = themeService.updateThemeConfig(tenantId, request, userId);

            // Then
            assertThat(response.getVersion()).isEqualTo(4);
            verify(versionRepository).save(any(ConfigVersion.class));
        }

        @Test
        @DisplayName("Deve salvar snapshot da versao anterior")
        void shouldSaveVersionSnapshot() {
            // Given
            testConfig.setVersion(2);
            ThemeConfigRequest request = ThemeConfigRequest.builder()
                    .primaryColor("#4CAF50")
                    .changeDescription("Mudanca para verde")
                    .build();

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(versionRepository.countByTenantId(tenantId)).thenReturn(2L);

            // When
            themeService.updateThemeConfig(tenantId, request, userId);

            // Then
            verify(versionRepository).save(argThat(version ->
                    version.getTenantId().equals(tenantId) &&
                    version.getVersion().equals(2) &&
                    version.getConfigSnapshot() != null
            ));
        }

        @Test
        @DisplayName("Deve permitir rollback para versao anterior")
        void shouldAllowRollbackToPreviousVersion() {
            // Given
            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("primaryColor", "#1976D2");
            snapshot.put("secondaryColor", "#424242");
            snapshot.put("backgroundColor", "#FFFFFF");

            ConfigVersion previousVersion = ConfigVersion.builder()
                    .id(UUID.randomUUID())
                    .tenantId(tenantId)
                    .version(2)
                    .configSnapshot(snapshot)
                    .build();

            testConfig.setVersion(5);
            testConfig.setPrimaryColor("#FF0000"); // Cor atual diferente

            when(versionRepository.findByTenantIdAndVersion(tenantId, 2))
                    .thenReturn(Optional.of(previousVersion));
            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            ThemeConfigResponse response = themeService.rollbackToVersion(tenantId, 2, userId);

            // Then
            assertThat(response.getPrimaryColor()).isEqualTo("#1976D2");
            assertThat(response.getVersion()).isEqualTo(6); // Nova versao apos rollback
        }

        @Test
        @DisplayName("Deve lancar excecao para versao inexistente no rollback")
        void shouldThrowExceptionForNonExistentVersion() {
            // Given
            when(versionRepository.findByTenantIdAndVersion(tenantId, 99))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> themeService.rollbackToVersion(tenantId, 99, userId))
                    .isInstanceOf(ConfigNotFoundException.class)
                    .hasMessageContaining("Versao 99 nao encontrada");
        }

        @Test
        @DisplayName("Deve limpar versoes antigas quando exceder limite")
        void shouldCleanupOldVersionsWhenExceedingLimit() {
            // Given
            ReflectionTestUtils.setField(themeService, "maxVersions", 5);

            ThemeConfigRequest request = ThemeConfigRequest.builder()
                    .primaryColor("#9C27B0")
                    .build();

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(versionRepository.countByTenantId(tenantId)).thenReturn(10L); // Acima do limite
            when(versionRepository.findMaxVersionByTenantId(tenantId)).thenReturn(Optional.of(10));

            // When
            themeService.updateThemeConfig(tenantId, request, userId);

            // Then
            verify(versionRepository).deleteOldVersions(eq(tenantId), eq(6)); // Manter versoes 6-10
        }
    }

    // ==================== Testes Adicionais ====================

    @Nested
    @DisplayName("Testes Gerais")
    class GeneralTests {

        @Test
        @DisplayName("Deve lancar excecao quando configuracao nao existe")
        void shouldThrowExceptionWhenConfigNotFound() {
            // Given
            when(configRepository.findByTenantIdAndIsActiveTrue(tenantId))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> themeService.getThemeConfig(tenantId))
                    .isInstanceOf(ConfigNotFoundException.class)
                    .hasMessageContaining("Configuracao nao encontrada");
        }

        @Test
        @DisplayName("Deve criar configuracao padrao quando nao existe")
        void shouldCreateDefaultConfigWhenNotExists() {
            // Given
            when(configRepository.findByTenantIdAndIsActiveTrue(tenantId))
                    .thenReturn(Optional.empty());
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> {
                        TenantConfig saved = inv.getArgument(0);
                        saved.setId(UUID.randomUUID());
                        return saved;
                    });

            // When
            ThemeConfigResponse response = themeService.getOrCreateThemeConfig(tenantId);

            // Then
            assertThat(response.getPrimaryColor()).isEqualTo("#1976D2");
            assertThat(response.getBackgroundColor()).isEqualTo("#FFFFFF");
            assertThat(response.getVersion()).isEqualTo(1);
            verify(configRepository).save(any(TenantConfig.class));
        }

        @Test
        @DisplayName("Deve retornar configuracao existente sem criar nova")
        void shouldReturnExistingConfig() {
            // Given
            when(configRepository.findByTenantIdAndIsActiveTrue(tenantId))
                    .thenReturn(Optional.of(testConfig));

            // When
            ThemeConfigResponse response = themeService.getOrCreateThemeConfig(tenantId);

            // Then
            assertThat(response.getTenantId()).isEqualTo(tenantId);
            verify(configRepository, never()).save(any());
        }

        @Test
        @DisplayName("Deve atualizar apenas campos fornecidos")
        void shouldUpdateOnlyProvidedFields() {
            // Given
            String originalSecondary = testConfig.getSecondaryColor();
            ThemeConfigRequest request = ThemeConfigRequest.builder()
                    .primaryColor("#E91E63") // Apenas cor primaria
                    .build();

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(versionRepository.countByTenantId(tenantId)).thenReturn(1L);

            // When
            ThemeConfigResponse response = themeService.updateThemeConfig(tenantId, request, userId);

            // Then
            assertThat(response.getPrimaryColor()).isEqualTo("#E91E63");
            assertThat(response.getSecondaryColor()).isEqualTo(originalSecondary); // Nao alterado
        }
    }
}
