package com.axonrh.employee.service;

import com.axonrh.employee.entity.AdmissionDocument;
import com.axonrh.employee.entity.AdmissionProcess;
import com.axonrh.employee.entity.enums.DocumentValidationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

/**
 * T110-T111 - Servico de validacao de documentos com OCR.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentValidationService {

    private final OcrService ocrService;

    private static final Set<String> REQUIRED_DOCUMENTS = Set.of(
            "RG", "CPF", "COMPROVANTE_RESIDENCIA", "FOTO_3X4"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "application/pdf"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * Valida arquivo antes do upload.
     */
    public void validateFile(MultipartFile file, String documentType) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Arquivo muito grande. Maximo: 10MB");
        }

        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new IllegalArgumentException("Tipo de arquivo nao permitido. Aceitos: JPG, PNG, PDF");
        }
    }

    /**
     * Processa documento com OCR e extrai dados.
     */
    public Map<String, Object> processDocumentOcr(AdmissionDocument document, byte[] fileContent) {
        log.info("Processando OCR para documento: {} - tipo: {}", document.getId(), document.getDocumentType());

        try {
            Map<String, Object> ocrResult = ocrService.extractData(
                    fileContent,
                    document.getMimeType(),
                    document.getDocumentType()
            );

            document.setOcrData(ocrResult);
            document.setOcrConfidence(ocrResult.containsKey("confidence") ?
                    (Double) ocrResult.get("confidence") : 0.0);
            document.setOcrProcessedAt(LocalDateTime.now());

            // Valida dados extraidos
            validateExtractedData(document, ocrResult);

            log.info("OCR processado: {} - confianca: {}", document.getId(), document.getOcrConfidence());
            return ocrResult;

        } catch (Exception e) {
            log.error("Erro no OCR do documento {}: {}", document.getId(), e.getMessage());
            document.setValidationStatus(DocumentValidationStatus.NEEDS_REVIEW);
            document.setValidationMessage("Erro ao processar documento: " + e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Valida dados extraidos do OCR.
     */
    private void validateExtractedData(AdmissionDocument document, Map<String, Object> ocrData) {
        String docType = document.getDocumentType();

        switch (docType) {
            case "RG" -> validateRgData(document, ocrData);
            case "CPF" -> validateCpfData(document, ocrData);
            case "CNH" -> validateCnhData(document, ocrData);
            case "COMPROVANTE_RESIDENCIA" -> validateAddressData(document, ocrData);
            default -> {
                // Documento generico - apenas marca como valido se teve OCR
                if (document.getOcrConfidence() > 0.5) {
                    document.setValidationStatus(DocumentValidationStatus.VALID);
                } else {
                    document.setValidationStatus(DocumentValidationStatus.NEEDS_REVIEW);
                    document.setValidationMessage("Documento requer verificacao manual");
                }
            }
        }
    }

    private void validateRgData(AdmissionDocument document, Map<String, Object> ocrData) {
        boolean hasName = ocrData.containsKey("nome");
        boolean hasNumber = ocrData.containsKey("numero");
        boolean hasBirthDate = ocrData.containsKey("dataNascimento");

        if (hasName && hasNumber && hasBirthDate && document.getOcrConfidence() > 0.7) {
            document.setValidationStatus(DocumentValidationStatus.VALID);
        } else if (hasNumber) {
            document.setValidationStatus(DocumentValidationStatus.NEEDS_REVIEW);
            document.setValidationMessage("Alguns dados nao foram identificados claramente");
        } else {
            document.setValidationStatus(DocumentValidationStatus.INVALID);
            document.setValidationMessage("Documento ilegivel ou invalido");
        }
    }

    private void validateCpfData(AdmissionDocument document, Map<String, Object> ocrData) {
        String cpfNumber = (String) ocrData.get("numero");

        if (cpfNumber != null && cpfNumber.replaceAll("\\D", "").length() == 11) {
            document.setValidationStatus(DocumentValidationStatus.VALID);
        } else {
            document.setValidationStatus(DocumentValidationStatus.NEEDS_REVIEW);
            document.setValidationMessage("CPF nao identificado claramente");
        }
    }

    private void validateCnhData(AdmissionDocument document, Map<String, Object> ocrData) {
        boolean hasNumber = ocrData.containsKey("numeroRegistro");
        boolean hasCategory = ocrData.containsKey("categoria");
        boolean hasValidity = ocrData.containsKey("validade");

        if (hasNumber && hasCategory && hasValidity) {
            // Verifica validade
            String validade = (String) ocrData.get("validade");
            // Logica de verificacao de data...
            document.setValidationStatus(DocumentValidationStatus.VALID);
        } else {
            document.setValidationStatus(DocumentValidationStatus.NEEDS_REVIEW);
            document.setValidationMessage("Dados da CNH incompletos");
        }
    }

    private void validateAddressData(AdmissionDocument document, Map<String, Object> ocrData) {
        boolean hasAddress = ocrData.containsKey("endereco") || ocrData.containsKey("logradouro");

        if (hasAddress && document.getOcrConfidence() > 0.6) {
            document.setValidationStatus(DocumentValidationStatus.VALID);
        } else {
            document.setValidationStatus(DocumentValidationStatus.NEEDS_REVIEW);
            document.setValidationMessage("Endereco nao identificado claramente");
        }
    }

    /**
     * Valida todos os documentos de um processo.
     */
    public boolean validateAllDocuments(AdmissionProcess process, UUID userId) {
        List<AdmissionDocument> documents = process.getDocuments();

        // Verifica documentos obrigatorios
        Set<String> uploadedTypes = new HashSet<>();
        for (AdmissionDocument doc : documents) {
            uploadedTypes.add(doc.getDocumentType());
        }

        for (String required : REQUIRED_DOCUMENTS) {
            if (!uploadedTypes.contains(required)) {
                log.warn("Documento obrigatorio ausente: {} - processo: {}", required, process.getId());
                return false;
            }
        }

        // Valida cada documento
        boolean allValid = true;
        for (AdmissionDocument doc : documents) {
            if (doc.getValidationStatus() == DocumentValidationStatus.PENDING) {
                doc.setValidationStatus(DocumentValidationStatus.NEEDS_REVIEW);
                doc.setValidationMessage("Aguardando validacao manual");
            }

            doc.setValidatedAt(LocalDateTime.now());
            doc.setValidatedBy(userId);

            if (doc.getValidationStatus() != DocumentValidationStatus.VALID) {
                allValid = false;
            }
        }

        return allValid;
    }

    /**
     * Lista documentos obrigatorios.
     */
    public Set<String> getRequiredDocuments() {
        return REQUIRED_DOCUMENTS;
    }

    /**
     * Verifica se todos os documentos obrigatorios foram enviados.
     */
    public boolean hasAllRequiredDocuments(AdmissionProcess process) {
        Set<String> uploadedTypes = new HashSet<>();
        for (AdmissionDocument doc : process.getDocuments()) {
            uploadedTypes.add(doc.getDocumentType());
        }
        return uploadedTypes.containsAll(REQUIRED_DOCUMENTS);
    }
}
