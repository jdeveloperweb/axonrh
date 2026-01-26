package com.axonrh.config.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuracao do cliente MinIO para armazenamento de logos e assets.
 */
@Configuration
@Slf4j
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket.logos}")
    private String logosBucket;

    @Value("${minio.bucket.assets}")
    private String assetsBucket;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }

    @PostConstruct
    public void initBuckets() {
        try {
            MinioClient client = minioClient();
            createBucketIfNotExists(client, logosBucket);
            createBucketIfNotExists(client, assetsBucket);
            log.info("MinIO buckets inicializados: {}, {}", logosBucket, assetsBucket);
        } catch (Exception e) {
            log.warn("Nao foi possivel inicializar buckets MinIO: {}", e.getMessage());
        }
    }

    private void createBucketIfNotExists(MinioClient client, String bucketName) {
        try {
            boolean exists = client.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder()
                        .bucket(bucketName)
                        .build());
                log.info("Bucket criado: {}", bucketName);
            }
        } catch (Exception e) {
            log.error("Erro ao criar bucket {}: {}", bucketName, e.getMessage());
        }
    }
}
