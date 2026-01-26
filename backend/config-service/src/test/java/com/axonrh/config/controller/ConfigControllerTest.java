package com.axonrh.config.controller;

import com.axonrh.config.dto.*;
import com.axonrh.config.exception.ConfigNotFoundException;
import com.axonrh.config.exception.GlobalExceptionHandler;
import com.axonrh.config.exception.InvalidColorException;
import com.axonrh.config.service.LogoService;
import com.axonrh.config.service.ThemeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Testes de integracao do ConfigController.
 */
@ExtendWith(MockitoExtension.class)
class ConfigControllerTest {

    @Mock
    private ThemeService themeService;

    @Mock
    private LogoService logoService;

    @InjectMocks
    private ConfigController configController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private UUID tenantId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(configController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("GET /api/v1/config/theme/{tenantId}")
    class GetThemeConfigTests {

        @Test
        @DisplayName("Deve retornar configuracao de tema")
        void shouldReturnThemeConfig() throws Exception {
            // Given
            ThemeConfigResponse response = ThemeConfigResponse.builder()
                    .tenantId(tenantId)
                    .primaryColor("#1976D2")
                    .backgroundColor("#FFFFFF")
                    .version(1)
                    .build();

            when(themeService.getOrCreateThemeConfig(tenantId)).thenReturn(response);

            // When & Then
            mockMvc.perform(get("/api/v1/config/theme/{tenantId}", tenantId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.tenantId").value(tenantId.toString()))
                    .andExpect(jsonPath("$.primaryColor").value("#1976D2"))
                    .andExpect(jsonPath("$.backgroundColor").value("#FFFFFF"));
        }

        @Test
        @DisplayName("Deve retornar 404 quando configuracao nao encontrada")
        void shouldReturn404WhenNotFound() throws Exception {
            // Given
            when(themeService.getOrCreateThemeConfig(tenantId))
                    .thenThrow(new ConfigNotFoundException("Configuracao nao encontrada"));

            // When & Then
            mockMvc.perform(get("/api/v1/config/theme/{tenantId}", tenantId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("CONFIG_NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/config/theme/{tenantId}")
    class UpdateThemeConfigTests {

        @Test
        @DisplayName("Deve atualizar configuracao de tema")
        void shouldUpdateThemeConfig() throws Exception {
            // Given
            ThemeConfigRequest request = ThemeConfigRequest.builder()
                    .primaryColor("#FF5722")
                    .secondaryColor("#424242")
                    .build();

            ThemeConfigResponse response = ThemeConfigResponse.builder()
                    .tenantId(tenantId)
                    .primaryColor("#FF5722")
                    .secondaryColor("#424242")
                    .version(2)
                    .build();

            when(themeService.updateThemeConfig(eq(tenantId), any(ThemeConfigRequest.class), eq(userId)))
                    .thenReturn(response);

            // When & Then
            mockMvc.perform(put("/api/v1/config/theme/{tenantId}", tenantId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("X-User-Id", userId.toString())
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.primaryColor").value("#FF5722"))
                    .andExpect(jsonPath("$.version").value(2));
        }

        @Test
        @DisplayName("Deve retornar 400 para cor invalida")
        void shouldReturn400ForInvalidColor() throws Exception {
            // Given
            ThemeConfigRequest request = ThemeConfigRequest.builder()
                    .textPrimaryColor("#CCCCCC")
                    .backgroundColor("#FFFFFF")
                    .build();

            when(themeService.updateThemeConfig(eq(tenantId), any(ThemeConfigRequest.class), eq(userId)))
                    .thenThrow(new InvalidColorException("Contraste insuficiente"));

            // When & Then
            mockMvc.perform(put("/api/v1/config/theme/{tenantId}", tenantId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("X-User-Id", userId.toString())
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("INVALID_COLOR"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/config/theme/{tenantId}/css")
    class GetCssVariablesTests {

        @Test
        @DisplayName("Deve retornar CSS gerado")
        void shouldReturnGeneratedCss() throws Exception {
            // Given
            String cssContent = ":root { --color-primary: #1976D2; }";
            CssVariablesResponse response = CssVariablesResponse.builder()
                    .cssContent(cssContent)
                    .version(1)
                    .cacheKey("css-tenant-v1")
                    .build();

            when(themeService.generateCssVariables(tenantId)).thenReturn(response);

            // When & Then
            mockMvc.perform(get("/api/v1/config/theme/{tenantId}/css", tenantId))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType("text/css"))
                    .andExpect(content().string(cssContent))
                    .andExpect(header().exists("Cache-Control"))
                    .andExpect(header().string("ETag", "css-tenant-v1"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/config/theme/{tenantId}/variables")
    class GetCssVariablesJsonTests {

        @Test
        @DisplayName("Deve retornar variaveis CSS como JSON")
        void shouldReturnCssVariablesAsJson() throws Exception {
            // Given
            Map<String, String> lightTheme = new HashMap<>();
            lightTheme.put("--color-primary", "#1976D2");
            lightTheme.put("--color-background", "#FFFFFF");

            CssVariablesResponse response = CssVariablesResponse.builder()
                    .cssContent(":root { }")
                    .lightTheme(lightTheme)
                    .version(1)
                    .build();

            when(themeService.generateCssVariables(tenantId)).thenReturn(response);

            // When & Then
            mockMvc.perform(get("/api/v1/config/theme/{tenantId}/variables", tenantId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.lightTheme.--color-primary").value("#1976D2"))
                    .andExpect(jsonPath("$.version").value(1));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/config/theme/validate-contrast")
    class ValidateContrastTests {

        @Test
        @DisplayName("Deve retornar true para contraste valido")
        void shouldReturnTrueForValidContrast() throws Exception {
            // Given
            when(themeService.validateContrast("#000000", "#FFFFFF")).thenReturn(true);

            // When & Then
            mockMvc.perform(get("/api/v1/config/theme/validate-contrast")
                            .param("foreground", "#000000")
                            .param("background", "#FFFFFF"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.valid").value(true))
                    .andExpect(jsonPath("$.foreground").value("#000000"))
                    .andExpect(jsonPath("$.background").value("#FFFFFF"));
        }

        @Test
        @DisplayName("Deve retornar false para contraste invalido")
        void shouldReturnFalseForInvalidContrast() throws Exception {
            // Given
            when(themeService.validateContrast("#888888", "#999999")).thenReturn(false);

            // When & Then
            mockMvc.perform(get("/api/v1/config/theme/validate-contrast")
                            .param("foreground", "#888888")
                            .param("background", "#999999"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.valid").value(false));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/config/theme/{tenantId}/rollback/{version}")
    class RollbackTests {

        @Test
        @DisplayName("Deve fazer rollback para versao anterior")
        void shouldRollbackToPreviousVersion() throws Exception {
            // Given
            ThemeConfigResponse response = ThemeConfigResponse.builder()
                    .tenantId(tenantId)
                    .primaryColor("#1976D2")
                    .version(6)
                    .build();

            when(themeService.rollbackToVersion(tenantId, 3, userId)).thenReturn(response);

            // When & Then
            mockMvc.perform(post("/api/v1/config/theme/{tenantId}/rollback/{version}", tenantId, 3)
                            .header("X-User-Id", userId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.version").value(6));
        }

        @Test
        @DisplayName("Deve retornar 404 para versao inexistente")
        void shouldReturn404ForNonExistentVersion() throws Exception {
            // Given
            when(themeService.rollbackToVersion(tenantId, 99, userId))
                    .thenThrow(new ConfigNotFoundException("Versao 99 nao encontrada"));

            // When & Then
            mockMvc.perform(post("/api/v1/config/theme/{tenantId}/rollback/{version}", tenantId, 99)
                            .header("X-User-Id", userId.toString()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("CONFIG_NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/config/logo/{tenantId}")
    class LogoUploadTests {

        @Test
        @DisplayName("Deve fazer upload de logo")
        void shouldUploadLogo() throws Exception {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "logo.png",
                    MediaType.IMAGE_PNG_VALUE,
                    new byte[1024]
            );

            LogoUploadResponse response = LogoUploadResponse.success(
                    "http://localhost:9000/logos/logo.png",
                    "logo.png",
                    "image/png",
                    1024L
            );

            when(logoService.uploadLogo(eq(tenantId), any(), eq(userId))).thenReturn(response);

            // When & Then
            mockMvc.perform(multipart("/api/v1/config/logo/{tenantId}", tenantId)
                            .file(file)
                            .header("X-User-Id", userId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.url").value("http://localhost:9000/logos/logo.png"))
                    .andExpect(jsonPath("$.fileName").value("logo.png"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/config/logo/{tenantId}")
    class GetLogoTests {

        @Test
        @DisplayName("Deve retornar URL do logo")
        void shouldReturnLogoUrl() throws Exception {
            // Given
            String logoUrl = "http://localhost:9000/logos/logo.png";
            when(logoService.getLogoUrl(tenantId)).thenReturn(logoUrl);

            // When & Then
            mockMvc.perform(get("/api/v1/config/logo/{tenantId}", tenantId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.tenantId").value(tenantId.toString()))
                    .andExpect(jsonPath("$.logoUrl").value(logoUrl));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/config/logo/{tenantId}")
    class DeleteLogoTests {

        @Test
        @DisplayName("Deve deletar logo")
        void shouldDeleteLogo() throws Exception {
            // Given
            doNothing().when(logoService).deleteLogo(tenantId, userId);

            // When & Then
            mockMvc.perform(delete("/api/v1/config/logo/{tenantId}", tenantId)
                            .header("X-User-Id", userId.toString()))
                    .andExpect(status().isNoContent());

            verify(logoService).deleteLogo(tenantId, userId);
        }
    }
}
