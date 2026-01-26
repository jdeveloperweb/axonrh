package com.axonrh.config.service;

import com.axonrh.config.dto.LogoUploadResponse;
import com.axonrh.config.entity.TenantConfig;
import com.axonrh.config.exception.ConfigNotFoundException;
import com.axonrh.config.exception.InvalidFileException;
import com.axonrh.config.repository.TenantConfigRepository;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Testes unitarios do LogoService.
 * Teste T062 - Upload e validacao de logo.
 */
@ExtendWith(MockitoExtension.class)
class LogoServiceTest {

    @Mock
    private MinioClient minioClient;

    @Mock
    private TenantConfigRepository configRepository;

    @InjectMocks
    private LogoService logoService;

    private UUID tenantId;
    private UUID userId;
    private TenantConfig testConfig;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(logoService, "logosBucket", "tenant-logos");
        ReflectionTestUtils.setField(logoService, "minioEndpoint", "http://localhost:9000");
        ReflectionTestUtils.setField(logoService, "maxLogoSizeKb", 500);
        ReflectionTestUtils.setField(logoService, "allowedFormats", "png,jpg,jpeg,svg");

        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();

        testConfig = TenantConfig.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .primaryColor("#1976D2")
                .version(1)
                .isActive(true)
                .build();
    }

    @Nested
    @DisplayName("T062: Upload de Logo")
    class LogoUploadTests {

        @Test
        @DisplayName("Deve fazer upload de logo PNG valido")
        void shouldUploadValidPngLogo() throws Exception {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "logo.png",
                    "image/png",
                    new byte[1024] // 1KB
            );

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            LogoUploadResponse response = logoService.uploadLogo(tenantId, file, userId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getUrl()).contains("localhost:9000");
            assertThat(response.getUrl()).contains("tenant-logos");
            assertThat(response.getFileName()).contains("logo");
            assertThat(response.getContentType()).isEqualTo("image/png");
            assertThat(response.getMessage()).contains("sucesso");

            verify(minioClient).putObject(any(PutObjectArgs.class));
            verify(configRepository).save(any(TenantConfig.class));
        }

        @Test
        @DisplayName("Deve fazer upload de logo JPG valido")
        void shouldUploadValidJpgLogo() throws Exception {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "logo.jpg",
                    "image/jpeg",
                    new byte[2048]
            );

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            LogoUploadResponse response = logoService.uploadLogo(tenantId, file, userId);

            // Then
            assertThat(response.getContentType()).isEqualTo("image/jpeg");
            assertThat(response.getFileName()).endsWith(".jpg");
        }

        @Test
        @DisplayName("Deve fazer upload de logo SVG valido")
        void shouldUploadValidSvgLogo() throws Exception {
            // Given
            String svgContent = "<svg xmlns='http://www.w3.org/2000/svg'><circle r='50'/></svg>";
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "logo.svg",
                    "image/svg+xml",
                    svgContent.getBytes()
            );

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            LogoUploadResponse response = logoService.uploadLogo(tenantId, file, userId);

            // Then
            assertThat(response.getContentType()).isEqualTo("image/svg+xml");
        }

        @Test
        @DisplayName("Deve rejeitar arquivo vazio")
        void shouldRejectEmptyFile() {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "logo.png",
                    "image/png",
                    new byte[0]
            );

            // When & Then
            assertThatThrownBy(() -> logoService.uploadLogo(tenantId, file, userId))
                    .isInstanceOf(InvalidFileException.class)
                    .hasMessageContaining("vazio");
        }

        @Test
        @DisplayName("Deve rejeitar arquivo maior que 500KB")
        void shouldRejectFileLargerThan500KB() {
            // Given
            byte[] largeContent = new byte[600 * 1024]; // 600KB
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "logo.png",
                    "image/png",
                    largeContent
            );

            // When & Then
            assertThatThrownBy(() -> logoService.uploadLogo(tenantId, file, userId))
                    .isInstanceOf(InvalidFileException.class)
                    .hasMessageContaining("tamanho maximo");
        }

        @Test
        @DisplayName("Deve rejeitar tipo de arquivo nao permitido")
        void shouldRejectNotAllowedFileType() {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "document.pdf",
                    "application/pdf",
                    new byte[1024]
            );

            // When & Then
            assertThatThrownBy(() -> logoService.uploadLogo(tenantId, file, userId))
                    .isInstanceOf(InvalidFileException.class)
                    .hasMessageContaining("Tipo de arquivo nao permitido");
        }

        @Test
        @DisplayName("Deve rejeitar extensao nao permitida")
        void shouldRejectNotAllowedExtension() {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "logo.gif",
                    "image/gif",
                    new byte[1024]
            );

            // When & Then
            assertThatThrownBy(() -> logoService.uploadLogo(tenantId, file, userId))
                    .isInstanceOf(InvalidFileException.class)
                    .hasMessageContaining("nao permitido");
        }

        @Test
        @DisplayName("Deve criar configuracao se nao existir")
        void shouldCreateConfigIfNotExists() throws Exception {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "logo.png",
                    "image/png",
                    new byte[1024]
            );

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.empty());
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> {
                        TenantConfig saved = inv.getArgument(0);
                        saved.setId(UUID.randomUUID());
                        return saved;
                    });

            // When
            LogoUploadResponse response = logoService.uploadLogo(tenantId, file, userId);

            // Then
            assertThat(response).isNotNull();
            verify(configRepository).save(argThat(config ->
                    config.getTenantId().equals(tenantId) &&
                    config.getLogoUrl() != null
            ));
        }
    }

    @Nested
    @DisplayName("Upload de Logo para Tema Escuro")
    class DarkLogoUploadTests {

        @Test
        @DisplayName("Deve fazer upload de logo para tema escuro")
        void shouldUploadDarkThemeLogo() throws Exception {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "logo-dark.png",
                    "image/png",
                    new byte[1024]
            );

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            LogoUploadResponse response = logoService.uploadLogoDark(tenantId, file, userId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getFileName()).contains("logo-dark");
            verify(configRepository).save(argThat(config ->
                    config.getLogoDarkUrl() != null
            ));
        }
    }

    @Nested
    @DisplayName("Upload de Favicon")
    class FaviconUploadTests {

        @Test
        @DisplayName("Deve fazer upload de favicon")
        void shouldUploadFavicon() throws Exception {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "favicon.png",
                    "image/png",
                    new byte[512]
            );

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            LogoUploadResponse response = logoService.uploadFavicon(tenantId, file, userId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getFileName()).contains("favicon");
            verify(configRepository).save(argThat(config ->
                    config.getFaviconUrl() != null
            ));
        }
    }

    @Nested
    @DisplayName("Upload de Background de Login")
    class LoginBackgroundUploadTests {

        @Test
        @DisplayName("Deve fazer upload de imagem de fundo do login")
        void shouldUploadLoginBackground() throws Exception {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "background.jpg",
                    "image/jpeg",
                    new byte[100 * 1024] // 100KB
            );

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            LogoUploadResponse response = logoService.uploadLoginBackground(tenantId, file, userId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getFileName()).contains("login-bg");
            verify(configRepository).save(argThat(config ->
                    config.getLoginBackgroundUrl() != null
            ));
        }
    }

    @Nested
    @DisplayName("Busca de Logo")
    class GetLogoTests {

        @Test
        @DisplayName("Deve retornar URL do logo")
        void shouldReturnLogoUrl() {
            // Given
            String expectedUrl = "http://localhost:9000/tenant-logos/logo.png";
            when(configRepository.findLogoUrlByTenantId(tenantId))
                    .thenReturn(Optional.of(expectedUrl));

            // When
            String url = logoService.getLogoUrl(tenantId);

            // Then
            assertThat(url).isEqualTo(expectedUrl);
        }

        @Test
        @DisplayName("Deve retornar null quando logo nao existe")
        void shouldReturnNullWhenLogoNotExists() {
            // Given
            when(configRepository.findLogoUrlByTenantId(tenantId))
                    .thenReturn(Optional.empty());

            // When
            String url = logoService.getLogoUrl(tenantId);

            // Then
            assertThat(url).isNull();
        }
    }

    @Nested
    @DisplayName("Remocao de Logo")
    class DeleteLogoTests {

        @Test
        @DisplayName("Deve remover logo existente")
        void shouldDeleteExistingLogo() throws Exception {
            // Given
            testConfig.setLogoUrl("http://localhost:9000/tenant-logos/tenant123/logo.png");

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(TenantConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            logoService.deleteLogo(tenantId, userId);

            // Then
            verify(configRepository).save(argThat(config ->
                    config.getLogoUrl() == null
            ));
        }

        @Test
        @DisplayName("Deve lancar excecao quando configuracao nao existe")
        void shouldThrowExceptionWhenConfigNotFound() {
            // Given
            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> logoService.deleteLogo(tenantId, userId))
                    .isInstanceOf(ConfigNotFoundException.class)
                    .hasMessageContaining("Configuracao nao encontrada");
        }

        @Test
        @DisplayName("Nao deve fazer nada quando logo nao existe")
        void shouldDoNothingWhenLogoNotExists() {
            // Given
            testConfig.setLogoUrl(null);

            when(configRepository.findByTenantId(tenantId))
                    .thenReturn(Optional.of(testConfig));

            // When
            logoService.deleteLogo(tenantId, userId);

            // Then
            verify(configRepository, never()).save(any());
        }
    }
}
