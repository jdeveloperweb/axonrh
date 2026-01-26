package com.axonrh.employee.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for OCR (Optical Character Recognition) processing of documents.
 * Integrates with external OCR API for text extraction from images and PDFs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OcrService {

    private final RestTemplate restTemplate;

    @Value("${ocr.api.url:http://localhost:8090/api/ocr}")
    private String ocrApiUrl;

    @Value("${ocr.api.key:}")
    private String ocrApiKey;

    @Value("${ocr.enabled:false}")
    private boolean ocrEnabled;

    /**
     * Extract data from document using OCR
     */
    public Map<String, Object> extractData(byte[] fileContent, String mimeType, String documentType) {
        log.info("Processing OCR for document type: {}", documentType);

        if (!ocrEnabled) {
            log.info("OCR disabled, using mock extraction");
            return mockExtraction(documentType);
        }

        try {
            String extractedText = callOcrApi(fileContent, mimeType);
            return parseDocumentData(extractedText, documentType);
        } catch (Exception e) {
            log.error("OCR processing failed: {}", e.getMessage());
            throw new RuntimeException("Falha no processamento OCR: " + e.getMessage(), e);
        }
    }

    /**
     * Call external OCR API
     */
    private String callOcrApi(byte[] fileContent, String mimeType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (!ocrApiKey.isEmpty()) {
            headers.set("Authorization", "Bearer " + ocrApiKey);
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("image", Base64.getEncoder().encodeToString(fileContent));
        requestBody.put("mimeType", mimeType);
        requestBody.put("language", "por");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(
            ocrApiUrl + "/extract",
            request,
            Map.class
        );

        if (response.getBody() != null && response.getBody().containsKey("text")) {
            return (String) response.getBody().get("text");
        }

        throw new RuntimeException("OCR API retornou resposta inválida");
    }

    /**
     * Parse extracted text based on document type
     */
    private Map<String, Object> parseDocumentData(String text, String documentType) {
        Map<String, Object> data = new HashMap<>();
        data.put("rawText", text);

        switch (documentType.toUpperCase()) {
            case "RG":
                parseRgData(text, data);
                break;
            case "CPF":
                parseCpfData(text, data);
                break;
            case "CNH":
                parseCnhData(text, data);
                break;
            case "CTPS":
                parseCtpsData(text, data);
                break;
            case "TITULO_ELEITOR":
                parseTituloEleitorData(text, data);
                break;
            case "CERTIDAO_NASCIMENTO":
            case "CERTIDAO_CASAMENTO":
                parseCertidaoData(text, data);
                break;
            case "COMPROVANTE_RESIDENCIA":
                parseComprovanteResidenciaData(text, data);
                break;
            default:
                log.warn("Unknown document type: {}", documentType);
        }

        // Calculate confidence based on extracted fields
        data.put("confidence", calculateConfidence(data, documentType));

        return data;
    }

    /**
     * Parse RG (Identity Card) data
     */
    private void parseRgData(String text, Map<String, Object> data) {
        // RG number pattern
        Pattern rgPattern = Pattern.compile("\\b(\\d{1,2}\\.?\\d{3}\\.?\\d{3}[-]?\\d?)\\b");
        Matcher rgMatcher = rgPattern.matcher(text);
        if (rgMatcher.find()) {
            data.put("numero", rgMatcher.group(1).replaceAll("[.-]", ""));
        }

        // Name pattern (usually after NOME or before FILIAÇÃO)
        Pattern namePattern = Pattern.compile("(?:NOME|NATURAL)\\s*:?\\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\\s]+)", Pattern.CASE_INSENSITIVE);
        Matcher nameMatcher = namePattern.matcher(text);
        if (nameMatcher.find()) {
            data.put("nome", nameMatcher.group(1).trim());
        }

        // Birth date pattern
        Pattern birthPattern = Pattern.compile("(?:NASCIMENTO|DATA.?NASC)\\s*:?\\s*(\\d{2}[/.-]\\d{2}[/.-]\\d{4})", Pattern.CASE_INSENSITIVE);
        Matcher birthMatcher = birthPattern.matcher(text);
        if (birthMatcher.find()) {
            data.put("dataNascimento", birthMatcher.group(1));
        }

        // CPF on RG
        Pattern cpfPattern = Pattern.compile("(\\d{3}\\.?\\d{3}\\.?\\d{3}[-.]?\\d{2})");
        Matcher cpfMatcher = cpfPattern.matcher(text);
        if (cpfMatcher.find()) {
            data.put("cpf", cpfMatcher.group(1).replaceAll("[.-]", ""));
        }

        // Issuing authority
        Pattern orgPattern = Pattern.compile("(?:SSP|DETRAN|IFP|IGP|PC)[-/]?([A-Z]{2})", Pattern.CASE_INSENSITIVE);
        Matcher orgMatcher = orgPattern.matcher(text);
        if (orgMatcher.find()) {
            data.put("orgaoEmissor", orgMatcher.group(0).toUpperCase());
        }
    }

    /**
     * Parse CPF card data
     */
    private void parseCpfData(String text, Map<String, Object> data) {
        // CPF number pattern
        Pattern cpfPattern = Pattern.compile("(\\d{3}\\.?\\d{3}\\.?\\d{3}[-.]?\\d{2})");
        Matcher cpfMatcher = cpfPattern.matcher(text);
        if (cpfMatcher.find()) {
            data.put("numero", cpfMatcher.group(1).replaceAll("[.-]", ""));
        }

        // Name
        Pattern namePattern = Pattern.compile("(?:NOME|Nome)\\s*:?\\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\\s]+)", Pattern.CASE_INSENSITIVE);
        Matcher nameMatcher = namePattern.matcher(text);
        if (nameMatcher.find()) {
            data.put("nome", nameMatcher.group(1).trim());
        }

        // Birth date
        Pattern birthPattern = Pattern.compile("(?:NASCIMENTO|NASC)\\s*:?\\s*(\\d{2}[/.-]\\d{2}[/.-]\\d{4})", Pattern.CASE_INSENSITIVE);
        Matcher birthMatcher = birthPattern.matcher(text);
        if (birthMatcher.find()) {
            data.put("dataNascimento", birthMatcher.group(1));
        }
    }

    /**
     * Parse CNH (Driver's License) data
     */
    private void parseCnhData(String text, Map<String, Object> data) {
        // CNH number
        Pattern cnhPattern = Pattern.compile("(?:REGISTRO|REG)\\s*:?\\s*(\\d{9,11})");
        Matcher cnhMatcher = cnhPattern.matcher(text);
        if (cnhMatcher.find()) {
            data.put("numeroRegistro", cnhMatcher.group(1));
        }

        // Category
        Pattern catPattern = Pattern.compile("(?:CATEGORIA|CAT)\\s*:?\\s*([A-E]+)");
        Matcher catMatcher = catPattern.matcher(text);
        if (catMatcher.find()) {
            data.put("categoria", catMatcher.group(1));
        }

        // Validity
        Pattern validPattern = Pattern.compile("(?:VALIDADE|VAL)\\s*:?\\s*(\\d{2}[/.-]\\d{2}[/.-]\\d{4})");
        Matcher validMatcher = validPattern.matcher(text);
        if (validMatcher.find()) {
            data.put("validade", validMatcher.group(1));
        }

        // CPF
        Pattern cpfPattern = Pattern.compile("(?:CPF)\\s*:?\\s*(\\d{3}\\.?\\d{3}\\.?\\d{3}[-.]?\\d{2})");
        Matcher cpfMatcher = cpfPattern.matcher(text);
        if (cpfMatcher.find()) {
            data.put("cpf", cpfMatcher.group(1).replaceAll("[.-]", ""));
        }

        // Name
        Pattern namePattern = Pattern.compile("(?:NOME|Nome)\\s*:?\\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\\s]+)");
        Matcher nameMatcher = namePattern.matcher(text);
        if (nameMatcher.find()) {
            data.put("nome", nameMatcher.group(1).trim());
        }

        // Birth date
        Pattern birthPattern = Pattern.compile("(?:NASCIMENTO|NASC)\\s*:?\\s*(\\d{2}[/.-]\\d{2}[/.-]\\d{4})");
        Matcher birthMatcher = birthPattern.matcher(text);
        if (birthMatcher.find()) {
            data.put("dataNascimento", birthMatcher.group(1));
        }
    }

    /**
     * Parse CTPS (Work Card) data
     */
    private void parseCtpsData(String text, Map<String, Object> data) {
        // CTPS number
        Pattern ctpsPattern = Pattern.compile("(?:CTPS|Nº)\\s*:?\\s*(\\d{7})");
        Matcher ctpsMatcher = ctpsPattern.matcher(text);
        if (ctpsMatcher.find()) {
            data.put("numero", ctpsMatcher.group(1));
        }

        // Series
        Pattern seriePattern = Pattern.compile("(?:SÉRIE|SERIE)\\s*:?\\s*(\\d{4,5}[-]?[A-Z]?)");
        Matcher serieMatcher = seriePattern.matcher(text);
        if (serieMatcher.find()) {
            data.put("serie", serieMatcher.group(1));
        }

        // UF
        Pattern ufPattern = Pattern.compile("(?:UF)\\s*:?\\s*([A-Z]{2})");
        Matcher ufMatcher = ufPattern.matcher(text);
        if (ufMatcher.find()) {
            data.put("uf", ufMatcher.group(1));
        }

        // Name
        Pattern namePattern = Pattern.compile("(?:NOME)\\s*:?\\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\\s]+)");
        Matcher nameMatcher = namePattern.matcher(text);
        if (nameMatcher.find()) {
            data.put("nome", nameMatcher.group(1).trim());
        }
    }

    /**
     * Parse Título de Eleitor data
     */
    private void parseTituloEleitorData(String text, Map<String, Object> data) {
        // Título number
        Pattern tituloPattern = Pattern.compile("(\\d{4}\\s?\\d{4}\\s?\\d{4})");
        Matcher tituloMatcher = tituloPattern.matcher(text);
        if (tituloMatcher.find()) {
            data.put("numero", tituloMatcher.group(1).replaceAll("\\s", ""));
        }

        // Zona
        Pattern zonaPattern = Pattern.compile("(?:ZONA)\\s*:?\\s*(\\d{3,4})");
        Matcher zonaMatcher = zonaPattern.matcher(text);
        if (zonaMatcher.find()) {
            data.put("zona", zonaMatcher.group(1));
        }

        // Seção
        Pattern secaoPattern = Pattern.compile("(?:SEÇÃO|SECAO)\\s*:?\\s*(\\d{3,4})");
        Matcher secaoMatcher = secaoPattern.matcher(text);
        if (secaoMatcher.find()) {
            data.put("secao", secaoMatcher.group(1));
        }
    }

    /**
     * Parse Certidão (Birth/Marriage Certificate) data
     */
    private void parseCertidaoData(String text, Map<String, Object> data) {
        // Matrícula (new format)
        Pattern matriculaPattern = Pattern.compile("(\\d{32})");
        Matcher matriculaMatcher = matriculaPattern.matcher(text);
        if (matriculaMatcher.find()) {
            data.put("matricula", matriculaMatcher.group(1));
        }

        // Name
        Pattern namePattern = Pattern.compile("(?:NOME)\\s*:?\\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\\s]+)");
        Matcher nameMatcher = namePattern.matcher(text);
        if (nameMatcher.find()) {
            data.put("nome", nameMatcher.group(1).trim());
        }

        // Registry date
        Pattern datePattern = Pattern.compile("(?:DATA|LAVRADA)\\s*:?\\s*(\\d{2}[/.-]\\d{2}[/.-]\\d{4})");
        Matcher dateMatcher = datePattern.matcher(text);
        if (dateMatcher.find()) {
            data.put("dataRegistro", dateMatcher.group(1));
        }
    }

    /**
     * Parse Comprovante de Residência data
     */
    private void parseComprovanteResidenciaData(String text, Map<String, Object> data) {
        // CEP
        Pattern cepPattern = Pattern.compile("(\\d{5}[-]?\\d{3})");
        Matcher cepMatcher = cepPattern.matcher(text);
        if (cepMatcher.find()) {
            data.put("cep", cepMatcher.group(1).replaceAll("-", ""));
        }

        // Address
        Pattern addressPattern = Pattern.compile("(?:RUA|AV|AVENIDA|ALAMEDA|TRAVESSA)\\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\\s\\d,.-]+)", Pattern.CASE_INSENSITIVE);
        Matcher addressMatcher = addressPattern.matcher(text);
        if (addressMatcher.find()) {
            data.put("endereco", addressMatcher.group(0).trim());
        }

        // City/State
        Pattern cityPattern = Pattern.compile("([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\\s]+)\\s*[-/]\\s*([A-Z]{2})\\b");
        Matcher cityMatcher = cityPattern.matcher(text);
        if (cityMatcher.find()) {
            data.put("cidade", cityMatcher.group(1).trim());
            data.put("estado", cityMatcher.group(2));
        }

        // Name on bill
        Pattern namePattern = Pattern.compile("(?:NOME|TITULAR|CLIENTE)\\s*:?\\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\\s]+)");
        Matcher nameMatcher = namePattern.matcher(text);
        if (nameMatcher.find()) {
            data.put("nome", nameMatcher.group(1).trim());
        }
    }

    /**
     * Calculate confidence score based on extracted data
     */
    private double calculateConfidence(Map<String, Object> data, String documentType) {
        int requiredFields = 0;
        int foundFields = 0;

        switch (documentType.toUpperCase()) {
            case "RG":
                requiredFields = 3; // numero, nome, dataNascimento
                if (data.containsKey("numero")) foundFields++;
                if (data.containsKey("nome")) foundFields++;
                if (data.containsKey("dataNascimento")) foundFields++;
                break;
            case "CPF":
                requiredFields = 2; // numero, nome
                if (data.containsKey("numero")) foundFields++;
                if (data.containsKey("nome")) foundFields++;
                break;
            case "CNH":
                requiredFields = 4; // numeroRegistro, nome, cpf, validade
                if (data.containsKey("numeroRegistro")) foundFields++;
                if (data.containsKey("nome")) foundFields++;
                if (data.containsKey("cpf")) foundFields++;
                if (data.containsKey("validade")) foundFields++;
                break;
            case "COMPROVANTE_RESIDENCIA":
                requiredFields = 2; // endereco, cep
                if (data.containsKey("endereco")) foundFields++;
                if (data.containsKey("cep")) foundFields++;
                break;
            default:
                requiredFields = 1;
                if (data.size() > 1) foundFields++;
        }

        return requiredFields > 0 ? (double) foundFields / requiredFields : 0.5;
    }

    /**
     * Mock extraction for development/testing
     */
    private Map<String, Object> mockExtraction(String documentType) {
        Map<String, Object> data = new HashMap<>();
        data.put("mock", true);
        data.put("confidence", 0.85);

        switch (documentType.toUpperCase()) {
            case "RG":
                data.put("numero", "123456789");
                data.put("nome", "NOME EXTRAIDO DO DOCUMENTO");
                data.put("dataNascimento", "01/01/1990");
                data.put("orgaoEmissor", "SSP/SP");
                break;
            case "CPF":
                data.put("numero", "12345678901");
                data.put("nome", "NOME EXTRAIDO DO DOCUMENTO");
                break;
            case "CNH":
                data.put("numeroRegistro", "12345678901");
                data.put("nome", "NOME EXTRAIDO DO DOCUMENTO");
                data.put("categoria", "AB");
                data.put("validade", "01/01/2030");
                break;
            case "COMPROVANTE_RESIDENCIA":
                data.put("endereco", "RUA EXEMPLO, 123");
                data.put("cep", "01234567");
                data.put("cidade", "SAO PAULO");
                data.put("estado", "SP");
                break;
            default:
                data.put("rawText", "Documento processado com sucesso");
        }

        return data;
    }
}
