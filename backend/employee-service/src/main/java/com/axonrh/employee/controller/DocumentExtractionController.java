package com.axonrh.employee.controller;

import com.axonrh.employee.service.FileStorageService;
import com.axonrh.employee.service.OpenAiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees/documents")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Documentos", description = "Extração inteligente de dados de documentos")
public class DocumentExtractionController {

    private final FileStorageService fileStorageService;
    private final OpenAiService openAiService;

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Extrai dados de documento via IA (OCR Inteligente)")
    public ResponseEntity<Map<String, Object>> extractData(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "employeeId", required = false) UUID employeeId) {

        log.info("Recebendo solicitação de extração de dados. Tamanho: {}", file.getSize());

        // 1. Armazena localmente (Backup/Auditoria)
        String storedPath = null;
        try {
            // Se não tiver employeeId, usa um temporário ou zeros, ou gera um
            UUID ownerId = employeeId != null ? employeeId : UUID.randomUUID();
            storedPath = fileStorageService.storeDocument(file, ownerId, "ia_extraction");
            log.info("Documento armazenado em: {}", storedPath);
        } catch (Exception e) {
            log.warn("Falha ao salvar backup do documento, prosseguindo com extração em memória", e);
        }

        // 2. Chama OpenAI
        try {
            Map<String, Object> extractedData = openAiService.extractDataFromDocument(file);
            extractedData.put("_storedPath", storedPath); // Metadata útil
            return ResponseEntity.ok(extractedData);
        } catch (Exception e) {
            log.error("Erro na extração IA", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Falha na análise do documento: " + e.getMessage()));
        }
    }
}
