package com.axonrh.employee.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenAiService {

    @Value("${application.openai.api-key:${OPENAI_API_KEY:}}")
    private String apiKey;

    @Value("${application.openai.model:gpt-4o}")
    private String model;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> extractDataFromDocument(MultipartFile file) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("OpenAI API Key not configured. Returning empty extraction.");
            return new HashMap<>();
        }

        try {
            // Prepare prompt specifically for Employee Data
            String prompt = """
                Analise este documento (RG, CNH, Comprovante de Residência, etc) e extraia os dados para cadastro de funcionário.
                Retorne APENAS um JSON válido (sem markdown ```json) com os seguintes campos (use null se não encontrar):
                {
                    "fullName": "Nome Completo",
                    "cpf": "123.456.789-00",
                    "rgNumber": "1234567",
                    "rgIssuer": "SSP/SP",
                    "birthDate": "YYYY-MM-DD",
                    "motherName": "Nome da Mãe",
                    "fatherName": "Nome do Pai",
                    "addressStreet": "Rua X",
                    "addressNumber": "123",
                    "addressNeighborhood": "Bairro",
                    "addressCity": "Cidade",
                    "addressState": "UF",
                    "addressZipCode": "00000-000",
                    "nationality": "Brasileira",
                    "gender": "MALE/FEMALE",
                    "pisPasep": "1234567890"
                }
                Se for uma única face do documento, extraia o que estiver disponível.
                """;

            Map<String, Object> payload = new HashMap<>();
            payload.put("model", model);
            payload.put("max_tokens", 1000);
            payload.put("response_format", Map.of("type", "json_object"));

            List<Map<String, Object>> contents = new ArrayList<>();
            contents.add(Map.of("type", "text", "text", prompt));

            if ("application/pdf".equalsIgnoreCase(file.getContentType())) {
                log.info("Processando arquivo PDF para extração de dados");
                List<String> base64Images = convertPdfToImages(file.getBytes());
                for (String base64Img : base64Images) {
                    Map<String, Object> imageContent = new HashMap<>();
                    imageContent.put("type", "image_url");
                    imageContent.put("image_url", Map.of("url", "data:image/png;base64," + base64Img));
                    contents.add(imageContent);
                }
            } else {
                String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
                String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
                Map<String, Object> imageContent = new HashMap<>();
                imageContent.put("type", "image_url");
                imageContent.put("image_url", Map.of("url", "data:" + mimeType + ";base64," + base64Image));
                contents.add(imageContent);
            }

            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", contents);
            
            payload.put("messages", List.of(message));

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                "https://api.openai.com/v1/chat/completions",
                HttpMethod.POST,
                entity,
                String.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String content = root.path("choices").get(0).path("message").path("content").asText();
                
                log.debug("Raw OpenAI Response Content: {}", content);

                // Cleanup content if it contains markdown code blocks
                content = content.trim();
                if (content.startsWith("```json")) {
                    content = content.substring(7);
                    if (content.endsWith("```")) {
                        content = content.substring(0, content.length() - 3);
                    }
                } else if (content.startsWith("```")) {
                     content = content.substring(3);
                    if (content.endsWith("```")) {
                        content = content.substring(0, content.length() - 3);
                    }
                }
                
                content = content.trim();

                try {
                    return objectMapper.readValue(content, Map.class);
                } catch (Exception e) {
                    log.error("Erro ao converter conteúdo JSON da OpenAI. Conteúdo recebido: {}", content);
                    throw e;
                }
            }

        } catch (IOException e) {
            log.error("Erro ao processar arquivo para OpenAI", e);
            throw new RuntimeException("Erro ao processar arquivo", e);
        } catch (Exception e) {
            log.error("Erro na chamada OpenAI", e);
            throw new RuntimeException("Falha na extração de dados via IA", e);
        }
        
        return new HashMap<>();
    }

    private List<String> convertPdfToImages(byte[] pdfBytes) throws IOException {
        List<String> base64Images = new ArrayList<>();
        try (PDDocument document = PDDocument.load(pdfBytes)) {
            PDFRenderer pdfRenderer = new PDFRenderer(document);
            // Limitamos a extração às primeiras 2 páginas para evitar payloads excessivos
            int pagesToProcess = Math.min(document.getNumberOfPages(), 2);
            for (int page = 0; page < pagesToProcess; ++page) {
                BufferedImage bim = pdfRenderer.renderImageWithDPI(page, 200, ImageType.RGB);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(bim, "png", baos);
                byte[] bytes = baos.toByteArray();
                base64Images.add(Base64.getEncoder().encodeToString(bytes));
            }
        }
        return base64Images;
    }
}
