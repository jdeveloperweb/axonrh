package com.axonrh.employee.service;

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
 * Serviço para armazenamento de arquivos localmente.
 * Futuramente será migrado para S3 ou outro serviço de armazenamento.
 */
@Service
@Slf4j
public class FileStorageService {

    private final Path fileStorageLocation;
    private final Path documentStorageLocation;

    public FileStorageService(@Value("${employee.photos.upload-dir:uploads/employee-photos}") String uploadDir,
                              @Value("${employee.documents.upload-dir:uploads/employee-documents}") String docUploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.documentStorageLocation = Paths.get(docUploadDir).toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.fileStorageLocation);
            Files.createDirectories(this.documentStorageLocation);
            log.info("Diretórios de upload criados: {} e {}", this.fileStorageLocation, this.documentStorageLocation);
        } catch (Exception ex) {
            log.error("Não foi possível criar os diretórios de upload", ex);
            throw new RuntimeException("Não foi possível criar os diretórios de upload", ex);
        }
    }

    /**
     * Salva a foto do colaborador.
     * 
     * @param file Arquivo da foto
     * @param employeeId ID do colaborador
     * @return Caminho relativo do arquivo salvo
     */
    public String storeEmployeePhoto(MultipartFile file, UUID employeeId) {
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
        
        String filename = employeeId + extension;

        try {
            // Copiar arquivo para o diretório de destino
            Path targetLocation = this.fileStorageLocation.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("Foto do colaborador {} salva com sucesso: {}", employeeId, filename);
            
            // Retornar caminho acessivel pela API (garante roteamento pelo gateway)
            return "/api/v1/employees/photos/" + filename;
        } catch (IOException ex) {
            log.error("Erro ao salvar foto do colaborador {}", employeeId, ex);
            throw new RuntimeException("Erro ao salvar arquivo", ex);
        }
    }

    /**
     * Deleta a foto do colaborador.
     * 
     * @param photoUrl URL da foto a ser deletada
     */
    public void deleteEmployeePhoto(String photoUrl) {
        if (photoUrl == null || photoUrl.isEmpty()) {
            return;
        }

        try {
            // Extrair nome do arquivo da URL
            String filename = photoUrl.substring(photoUrl.lastIndexOf("/") + 1);
            Path filePath = this.fileStorageLocation.resolve(filename);
            
            Files.deleteIfExists(filePath);
            log.info("Foto deletada com sucesso: {}", filename);
        } catch (IOException ex) {
            log.error("Erro ao deletar foto: {}", photoUrl, ex);
        }
    }

    public String storeDocument(MultipartFile file, UUID employeeId, String type) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Falha ao armazenar arquivo vazio.");
            }
            
            String cleanType = type != null ? type.replaceAll("[^a-zA-Z0-9_-]", "") : "misc";
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String filename = employeeId + "_" + cleanType + "_" + UUID.randomUUID() + extension;
            
            Path targetLocation = this.documentStorageLocation.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException ex) {
            throw new RuntimeException("Não foi possível armazenar o arquivo", ex);
        }
    }
}
