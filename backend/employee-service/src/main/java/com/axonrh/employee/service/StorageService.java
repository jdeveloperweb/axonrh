package com.axonrh.employee.service;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Service for file storage using MinIO.
 * Handles uploads, downloads, and URL generation for stored files.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket.name:axonrh}")
    private String bucketName;

    @Value("${minio.url.expiry:3600}")
    private int urlExpiry;

    /**
     * Upload file from byte array
     */
    public String uploadFile(byte[] content, String path, String contentType, String tenantId) {
        String fullPath = tenantId + "/" + path;

        try {
            ensureBucketExists();

            try (InputStream stream = new ByteArrayInputStream(content)) {
                minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(fullPath)
                    .stream(stream, content.length, -1)
                    .contentType(contentType)
                    .build());
            }

            log.info("File uploaded successfully: {}", fullPath);
            return fullPath;

        } catch (Exception e) {
            log.error("Error uploading file: {}", e.getMessage());
            throw new RuntimeException("Erro ao fazer upload do arquivo", e);
        }
    }

    /**
     * Upload multipart file
     */
    public String uploadFile(MultipartFile file, String directory, String tenantId) {
        String fileName = UUID.randomUUID() + "_" + sanitizeFileName(file.getOriginalFilename());
        String path = directory + "/" + fileName;

        try {
            return uploadFile(file.getBytes(), path, file.getContentType(), tenantId);
        } catch (Exception e) {
            log.error("Error uploading multipart file: {}", e.getMessage());
            throw new RuntimeException("Erro ao fazer upload do arquivo", e);
        }
    }

    /**
     * Download file as byte array
     */
    public byte[] downloadFile(String path) {
        try {
            try (InputStream stream = minioClient.getObject(GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(path)
                    .build())) {
                return stream.readAllBytes();
            }
        } catch (Exception e) {
            log.error("Error downloading file: {}", e.getMessage());
            throw new RuntimeException("Erro ao baixar arquivo", e);
        }
    }

    /**
     * Get presigned URL for file download
     */
    public String getPresignedUrl(String path) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .bucket(bucketName)
                .object(path)
                .method(Method.GET)
                .expiry(urlExpiry, TimeUnit.SECONDS)
                .build());
        } catch (Exception e) {
            log.error("Error generating presigned URL: {}", e.getMessage());
            throw new RuntimeException("Erro ao gerar URL do arquivo", e);
        }
    }

    /**
     * Get presigned URL for file upload
     */
    public String getUploadUrl(String path, String contentType) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .bucket(bucketName)
                .object(path)
                .method(Method.PUT)
                .expiry(urlExpiry, TimeUnit.SECONDS)
                .build());
        } catch (Exception e) {
            log.error("Error generating upload URL: {}", e.getMessage());
            throw new RuntimeException("Erro ao gerar URL de upload", e);
        }
    }

    /**
     * Delete file
     */
    public void deleteFile(String path) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                .bucket(bucketName)
                .object(path)
                .build());
            log.info("File deleted: {}", path);
        } catch (Exception e) {
            log.error("Error deleting file: {}", e.getMessage());
            throw new RuntimeException("Erro ao excluir arquivo", e);
        }
    }

    /**
     * Check if file exists
     */
    public boolean fileExists(String path) {
        try {
            minioClient.statObject(StatObjectArgs.builder()
                .bucket(bucketName)
                .object(path)
                .build());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get file metadata
     */
    public FileMetadata getFileMetadata(String path) {
        try {
            StatObjectResponse stat = minioClient.statObject(StatObjectArgs.builder()
                .bucket(bucketName)
                .object(path)
                .build());

            return new FileMetadata(
                path,
                stat.size(),
                stat.contentType(),
                stat.lastModified().toLocalDateTime()
            );
        } catch (Exception e) {
            log.error("Error getting file metadata: {}", e.getMessage());
            throw new RuntimeException("Erro ao obter metadados do arquivo", e);
        }
    }

    /**
     * Ensure bucket exists, create if not
     */
    private void ensureBucketExists() throws Exception {
        boolean exists = minioClient.bucketExists(BucketExistsArgs.builder()
            .bucket(bucketName)
            .build());

        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder()
                .bucket(bucketName)
                .build());
            log.info("Bucket created: {}", bucketName);
        }
    }

    /**
     * Sanitize file name for storage
     */
    private String sanitizeFileName(String fileName) {
        if (fileName == null) {
            return "unnamed";
        }
        return fileName.replaceAll("[^a-zA-Z0-9.-]", "_");
    }

    /**
     * File metadata record
     */
    public record FileMetadata(
        String path,
        long size,
        String contentType,
        java.time.LocalDateTime lastModified
    ) {}
}
