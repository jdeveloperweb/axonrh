package com.axonrh.vacation.service;

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
 * Serviço para armazenamento de atestados médicos localmente.
 */
@Service
@Slf4j
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${vacation.leaves.upload-dir:C:/Users/Jaime.Vicente/axonrh/uploads/medical-certificates}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("Diretório de upload de atestados criado: {}", this.fileStorageLocation);
        } catch (Exception ex) {
            log.error("Não foi possível criar o diretório de upload", ex);
            throw new RuntimeException("Não foi possível criar o diretório de upload", ex);
        }
    }

    /**
     * Salva o atestado médico.
     * 
     * @param file Arquivo do atestado
     * @return Caminho relativo do arquivo salvo acessível via API
     */
    public String storeCertificate(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio");
        }

        // Gerar nome único para o arquivo para evitar sobreposição
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        String filename = UUID.randomUUID().toString() + extension;

        try {
            // Copiar arquivo para o diretório de destino
            Path targetLocation = this.fileStorageLocation.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("Atestado salvo com sucesso: {}", filename);
            
            // Retornar path que o ResourceHandler vai servir
            return "/api/v1/leaves/certificates/" + filename;
        } catch (IOException ex) {
            log.error("Erro ao salvar atestado", ex);
            throw new RuntimeException("Erro ao salvar arquivo", ex);
        }
    }
}
