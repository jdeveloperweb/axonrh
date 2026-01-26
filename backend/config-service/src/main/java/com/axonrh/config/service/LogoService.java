package com.axonrh.config.service;

import com.axonrh.config.config.CacheConfig;
import com.axonrh.config.dto.LogoUploadResponse;
import com.axonrh.config.entity.TenantConfig;
import com.axonrh.config.exception.ConfigNotFoundException;
import com.axonrh.config.exception.InvalidFileException;
import com.axonrh.config.repository.TenantConfigRepository;
import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Servico para upload e gestao de logos.
 * Armazena arquivos no MinIO com URLs publicas.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LogoService {

    private final MinioClient minioClient;
    private final TenantConfigRepository configRepository;

    @Value("${minio.bucket.logos}")
    private String logosBucket;

    @Value("${minio.endpoint}")
    private String minioEndpoint;

    @Value("${config.theme.validation.max-logo-size-kb:500}")
    private int maxLogoSizeKb;

    @Value("${config.theme.validation.allowed-logo-formats:png,jpg,jpeg,svg}")
    private String allowedFormats;

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/png", "image/jpeg", "image/jpg", "image/svg+xml"
    );

    /**
     * Upload de logo principal.
     */
    @CacheEvict(value = CacheConfig.LOGO_CACHE, key = "#tenantId")
    @Transactional
    public LogoUploadResponse uploadLogo(UUID tenantId, MultipartFile file, UUID userId) {
        return uploadImage(tenantId, file, userId, "logo", config -> config::setLogoUrl);
    }

    /**
     * Upload de logo para tema escuro.
     */
    @CacheEvict(value = CacheConfig.LOGO_CACHE, key = "#tenantId")
    @Transactional
    public LogoUploadResponse uploadLogoDark(UUID tenantId, MultipartFile file, UUID userId) {
        return uploadImage(tenantId, file, userId, "logo-dark", config -> config::setLogoDarkUrl);
    }

    /**
     * Upload de favicon.
     */
    @CacheEvict(value = CacheConfig.LOGO_CACHE, key = "#tenantId")
    @Transactional
    public LogoUploadResponse uploadFavicon(UUID tenantId, MultipartFile file, UUID userId) {
        return uploadImage(tenantId, file, userId, "favicon", config -> config::setFaviconUrl);
    }

    /**
     * Upload de imagem de fundo da tela de login.
     */
    @CacheEvict(value = CacheConfig.THEME_CACHE, key = "#tenantId")
    @Transactional
    public LogoUploadResponse uploadLoginBackground(UUID tenantId, MultipartFile file, UUID userId) {
        return uploadImage(tenantId, file, userId, "login-bg", config -> config::setLoginBackgroundUrl);
    }

    /**
     * Busca URL do logo com cache.
     */
    @Cacheable(value = CacheConfig.LOGO_CACHE, key = "#tenantId")
    public String getLogoUrl(UUID tenantId) {
        return configRepository.findLogoUrlByTenantId(tenantId)
                .orElse(null);
    }

    /**
     * Remove logo.
     */
    @CacheEvict(value = CacheConfig.LOGO_CACHE, key = "#tenantId")
    @Transactional
    public void deleteLogo(UUID tenantId, UUID userId) {
        TenantConfig config = configRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ConfigNotFoundException("Configuracao nao encontrada"));

        if (config.getLogoUrl() != null) {
            deleteFromMinio(extractObjectName(config.getLogoUrl()));
            config.setLogoUrl(null);
            config.setUpdatedBy(userId);
            configRepository.save(config);
            log.info("Logo removido para tenant: {}", tenantId);
        }
    }

    // ==================== Metodos Privados ====================

    private LogoUploadResponse uploadImage(UUID tenantId, MultipartFile file, UUID userId,
                                           String prefix, java.util.function.Function<TenantConfig, java.util.function.Consumer<String>> urlSetter) {
        validateFile(file);

        TenantConfig config = configRepository.findByTenantId(tenantId)
                .orElseGet(() -> createDefaultConfig(tenantId));

        String fileName = generateFileName(tenantId, prefix, file.getOriginalFilename());

        try {
            String url = uploadToMinio(file, fileName);

            urlSetter.apply(config).accept(url);
            config.setUpdatedBy(userId);
            configRepository.save(config);

            log.info("Imagem {} enviada para tenant: {}", prefix, tenantId);

            return LogoUploadResponse.success(url, fileName, file.getContentType(), file.getSize());
        } catch (Exception e) {
            log.error("Erro ao fazer upload de imagem: {}", e.getMessage());
            throw new RuntimeException("Erro ao fazer upload: " + e.getMessage(), e);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Arquivo nao pode ser vazio");
        }

        // Valida tamanho
        long maxSizeBytes = maxLogoSizeKb * 1024L;
        if (file.getSize() > maxSizeBytes) {
            throw new InvalidFileException("Arquivo excede o tamanho maximo de " + maxLogoSizeKb + "KB");
        }

        // Valida tipo
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new InvalidFileException("Tipo de arquivo nao permitido. Permitidos: " + allowedFormats);
        }

        // Valida extensao
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String extension = getFileExtension(originalFilename).toLowerCase();
            List<String> allowedExtensions = Arrays.asList(allowedFormats.split(","));
            if (!allowedExtensions.contains(extension)) {
                throw new InvalidFileException("Extensao nao permitida: " + extension);
            }
        }
    }

    private String uploadToMinio(MultipartFile file, String objectName) throws Exception {
        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(logosBucket)
                    .object(objectName)
                    .stream(inputStream, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        }

        // Retorna URL publica
        return minioEndpoint + "/" + logosBucket + "/" + objectName;
    }

    private void deleteFromMinio(String objectName) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(logosBucket)
                    .object(objectName)
                    .build());
        } catch (Exception e) {
            log.warn("Erro ao remover objeto do MinIO: {}", e.getMessage());
        }
    }

    private String generateFileName(UUID tenantId, String prefix, String originalFilename) {
        String extension = getFileExtension(originalFilename);
        return tenantId + "/" + prefix + "-" + System.currentTimeMillis() + "." + extension;
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "png";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }

    private String extractObjectName(String url) {
        // Extrai nome do objeto da URL
        int bucketIndex = url.indexOf(logosBucket);
        if (bucketIndex > 0) {
            return url.substring(bucketIndex + logosBucket.length() + 1);
        }
        return url;
    }

    private TenantConfig createDefaultConfig(UUID tenantId) {
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
}
