package com.axonrh.ai.controller;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
import com.axonrh.ai.dto.ChatResponse;
import com.axonrh.ai.dto.ResumeAnalysisRequest;
import com.axonrh.ai.dto.ResumeAnalysisResponse;
import com.axonrh.ai.service.LlmService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
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

import java.util.Collections;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai/resume")
@RequiredArgsConstructor
@Tag(name = "Resume Analysis", description = "AI-powered resume analysis")
public class ResumeController {

    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    @PostMapping("/analyze")
    @Operation(summary = "Analyze resume text")
    public ResponseEntity<ResumeAnalysisResponse> analyzeResume(@RequestBody ResumeAnalysisRequest request) {
        log.info("Analyzing resume: {}", request.getFileName());

        String systemPrompt = """
            Você é um assistente especialista em recrutamento e seleção (RH).
            Sua tarefa é analisar o texto de um currículo e extrair informações estruturadas.
            Além disso, você deve comparar o perfil do candidato com os requisitos da vaga (se fornecidos) e gerar insights valiosos.
            
            Retorne APENAS um objeto JSON válido com a seguinte estrutura, sem markdown ou explicações adicionais:
            {
                "fullName": "Nome completo",
                "email": "Email",
                "phone": "Telefone fixo",
                "mobile": "Celular",
                "skills": ["Habilidade 1", "Habilidade 2"],
                "education": [
                    { "institution": "Nome", "degree": "Grau", "field": "Área", "startYear": "Ano", "endYear": "Ano", "current": boolean }
                ],
                "experiences": [
                    { "company": "Empresa", "position": "Cargo", "description": "Descrição", "startDate": "Data", "endDate": "Data", "current": boolean }
                ],
                "certifications": ["Certificação 1"],
                "languages": [
                    { "language": "Idioma", "level": "Nível (Básico, Intermediário, Avançado, Fluente, Nativo)" }
                ],
                "profileSummary": "Um resumo profissional do candidato",
                "compatibilityScore": 0-100 (número inteiro indicando aderência à vaga),
                "strengths": ["Ponto forte 1", "Ponto forte 2"],
                "concerns": ["Ponto de atenção 1"],
                "aiInsight": "Um comentário detalhado e direto para o recrutador, analisando o currículo em relação à vaga. Destaque se faz sentido ou não para a vaga e por quê."
            }
            """;

        String userPrompt = String.format("""
            TEXTO DO CURRÍCULO:
            %s
            
            REQUISITOS DA VAGA:
            %s
            """, request.getResumeText(), request.getVacancyRequirements() != null ? request.getVacancyRequirements() : "Não especificado");

        ChatRequest chatRequest = ChatRequest.builder()
                .messages(List.of(
                        ChatMessage.builder().role(ChatMessage.Role.SYSTEM).content(systemPrompt).build(),
                        ChatMessage.builder().role(ChatMessage.Role.USER).content(userPrompt).build()
                ))
                .temperature(0.2)
                .responseFormat("json_object") 
                .build();

        // Note: responseFormat is supported by newer OpenAI models. If fails, remove it.
        // Assuming LlmService handles standard calls.
        
        try {
            ChatResponse response = llmService.chat(chatRequest);
            String content = response.getContent();
            
            // Log raw response for debugging
            log.debug("AI Response: {}", content);
            
            // Clean up markdown code blocks if present (common issue even with JSON prompt)
            if (content.startsWith("```json")) {
                content = content.substring(7);
            }
            if (content.startsWith("```")) {
                content = content.substring(3);
            }
            if (content.endsWith("```")) {
                content = content.substring(0, content.length() - 3);
            }
            
            content = content.trim();

            ResumeAnalysisResponse analysisResponse = objectMapper.readValue(content, ResumeAnalysisResponse.class);
            return ResponseEntity.ok(analysisResponse);

        } catch (Exception e) {
            log.error("Error analyzing resume", e);
            // Return empty response or error? proceeding with empty to avoid blocking flow
            return ResponseEntity.ok(ResumeAnalysisResponse.builder()
                    .profileSummary("Falha na análise automática: " + e.getMessage())
                    .build());
        }
    }
}
