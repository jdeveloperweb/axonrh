package com.axonrh.ai.controller;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
import com.axonrh.ai.dto.ChatResponse;
import com.axonrh.ai.dto.MedicalCertificateAnalysisRequest;
import com.axonrh.ai.dto.MedicalCertificateAnalysisResponse;
import com.axonrh.ai.service.LlmService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai/medical")
@RequiredArgsConstructor
@Tag(name = "Medical Analysis", description = "AI-powered medical certificate analysis")
public class MedicalCertificateController {

    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    @PostMapping("/analyze")
    @Operation(summary = "Analyze medical certificate text")
    public ResponseEntity<MedicalCertificateAnalysisResponse> analyzeCertificate(@RequestBody MedicalCertificateAnalysisRequest request) {
        log.info("Analyzing medical certificate: {}", request.getFileName());

        String systemPrompt = """
            Você é um assistente especialista em processamento de documentos médicos para RH.
            Sua tarefa é analisar o texto de um atestado médico e extrair informações estruturadas.
            
            Retorne APENAS um objeto JSON válido com a seguinte estrutura, sem markdown ou explicações adicionais:
            {
                "cid": "Código do CID (ex: Z00.0, M54.5)",
                "cidDescription": "Descrição da doença/motivo conforme o CID",
                "doctorName": "Nome do médico",
                "crm": "CRM do médico",
                "days": "Quantidade de dias de afastamento (número inteiro)",
                "date": "Data do atestado (YYYY-MM-DD)"
            }
            
            Se não encontrar alguma informação, retorne null para o campo.
            """;

        String userPrompt = request.getCertificateText() != null ? String.format("""
            TEXTO DO ATESTADO (Extraído via OCR inicial):
            %s
            
            Por favor, valide as informações acima olhando para a imagem anexa e corrija se necessário.
            """, request.getCertificateText()) : "Por favor, analise a imagem anexa deste atestado médico e extraia as informações.";
 
         ChatRequest chatRequest = ChatRequest.builder()
                 .messages(List.of(
                         ChatMessage.builder().role(ChatMessage.Role.SYSTEM).content(systemPrompt).build(),
                         ChatMessage.builder()
                                 .role(ChatMessage.Role.USER)
                                 .content(userPrompt)
                                 .imageBase64(request.getImageBase64())
                                 .build()
                 ))
                 .temperature(0.1)
                 .responseFormat("json_object")
                 .build();

        try {
            ChatResponse response = llmService.chat(chatRequest);
            String content = response.getContent();
            
            log.debug("AI Medical Response: {}", content);
            
            // Clean up markdown
            if (content.startsWith("```json")) content = content.substring(7);
            if (content.startsWith("```")) content = content.substring(3);
            if (content.endsWith("```")) content = content.substring(0, content.length() - 3);
            content = content.trim();

            MedicalCertificateAnalysisResponse analysisResponse = objectMapper.readValue(content, MedicalCertificateAnalysisResponse.class);
            return ResponseEntity.ok(analysisResponse);

        } catch (Exception e) {
            log.error("Error analyzing medical certificate", e);
            return ResponseEntity.ok(MedicalCertificateAnalysisResponse.builder()
                    .cidDescription("Falha na análise: " + e.getMessage())
                    .build());
        }
    }
}
