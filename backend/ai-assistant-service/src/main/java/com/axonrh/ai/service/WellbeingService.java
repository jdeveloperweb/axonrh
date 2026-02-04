package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
import com.axonrh.ai.dto.ChatResponse;
import com.axonrh.ai.dto.WellbeingCheckInRequest;
import com.axonrh.ai.entity.EmployeeWellbeing;
import com.axonrh.ai.repository.EmployeeWellbeingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.axonrh.ai.dto.WellbeingStats;
@Slf4j
@Service
@RequiredArgsConstructor
public class WellbeingService {

    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    public WellbeingAnalysisResponse analyze(WellbeingAnalysisRequest request) {
        // Default values
        String sentiment = "NEUTRAL";
        String riskLevel = "LOW";
        String keywords = "";

        // Heuristics based on score
        if (request.getScore() != null) {
            if (request.getScore() <= 2) {
                sentiment = "NEGATIVE";
                riskLevel = "MEDIUM";
            } else if (request.getScore() >= 4) {
                sentiment = "POSITIVE";
            }
        }

        // AI Analysis if text is present
        if (request.getText() != null && !request.getText().trim().isEmpty() && request.getText().length() > 5) {
            try {
                String systemPrompt = "You are an HR AI expert. Analyze the employee's mood check-in note. " +
                        "Return ONLY a JSON object with keys: sentiment (POSITIVE, NEGATIVE, NEUTRAL), " +
                        "riskLevel (LOW, MEDIUM, HIGH), and keywords (comma separated string). " +
                        "High risk involves mentions of burnout, depression, harassment, or severe stress.";
                
                ChatRequest chatRequest = ChatRequest.builder()
                        .messages(List.of(
                                ChatMessage.builder().role(ChatMessage.Role.SYSTEM).content(systemPrompt).build(),
                                ChatMessage.builder().role(ChatMessage.Role.USER).content(request.getText()).build()
                        ))
                        .temperature(0.0)
                        .maxTokens(150)
                        .build();

                ChatResponse response = llmService.chat(chatRequest);
                if (response.getContent() != null) {
                    try {
                        String content = response.getContent().replace("```json", "").replace("```", "").trim();
                        JsonNode json = objectMapper.readTree(content);
                        sentiment = json.path("sentiment").asText(sentiment);
                        riskLevel = json.path("riskLevel").asText(riskLevel);
                        keywords = json.path("keywords").asText("");
                    } catch (Exception e) {
                        log.warn("Failed to parse AI response for wellbeing analysis: {}", response.getContent());
                    }
                }
            } catch (Exception e) {
                log.error("Error calling AI for wellbeing analysis", e);
            }
        }

        return WellbeingAnalysisResponse.builder()
                .sentiment(sentiment)
                .riskLevel(riskLevel)
                .keywords(keywords)
                .build();
    }
}
