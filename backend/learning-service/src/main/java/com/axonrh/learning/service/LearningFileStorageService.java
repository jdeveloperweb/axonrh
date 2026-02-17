package com.axonrh.learning.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Serviço para armazenamento de capas de treinamentos localmente.
 */
@Service
@Slf4j
public class LearningFileStorageService {

    private final Path thumbnailStorageLocation;

    public LearningFileStorageService(@Value("${learning.thumbnails.upload-dir:uploads/learning-thumbnails}") String uploadDir) {
        this.thumbnailStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.thumbnailStorageLocation);
            log.info("Diretório de upload de miniaturas criado: {}", this.thumbnailStorageLocation);
        } catch (Exception ex) {
            log.error("Não foi possível criar o diretório de upload de miniaturas", ex);
            throw new RuntimeException("Não foi possível criar o diretório de upload de miniaturas", ex);
        }
    }

    /**
     * Salva a miniatura do curso.
     * 
     * @param file Arquivo da miniatura
     * @param courseId ID do curso
     * @return Caminho relativo do arquivo salvo
     */
    public String storeCourseThumbnail(MultipartFile file, UUID courseId) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio");
        }

        // Validar tipo de arquivo
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Apenas imagens são permitidas");
        }

        // Gerar nome único para o arquivo
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        String filename = courseId + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

        try {
            // Copiar arquivo para o diretório de destino
            Path targetLocation = this.thumbnailStorageLocation.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("Miniatura do curso {} salva com sucesso: {}", courseId, filename);
            
            // Retornar caminho acessivel pela API
            return "/api/v1/learning/courses/thumbnails/" + filename;
        } catch (IOException ex) {
            log.error("Erro ao salvar miniatura do curso {}", courseId, ex);
            throw new RuntimeException("Erro ao salvar arquivo", ex);
        }
    }

    /**
     * Deleta a miniatura do curso.
     * 
     * @param thumbnailUrl URL da miniatura a ser deletada
     */
    public void deleteCourseThumbnail(String thumbnailUrl) {
        if (thumbnailUrl == null || thumbnailUrl.isEmpty() || !thumbnailUrl.contains("/thumbnails/")) {
            return;
        }

        try {
            // Extrair nome do arquivo da URL
            String filename = thumbnailUrl.substring(thumbnailUrl.lastIndexOf("/") + 1);
            Path filePath = this.thumbnailStorageLocation.resolve(filename);
            
            Files.deleteIfExists(filePath);
            log.info("Miniatura deletada com sucesso: {}", filename);
        } catch (IOException ex) {
            log.error("Erro ao deletar miniatura: {}", thumbnailUrl, ex);
        }
    }
}
