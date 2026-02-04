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
import com.axonrh.ai.dto.WellbeingAnalysisRequest;
import com.axonrh.ai.dto.WellbeingAnalysisResponse;
import com.axonrh.ai.dto.WellbeingStats;
import org.springframework.stereotype.Service;

import java.util.List;
import com.axonrh.ai.dto.EapRequestDTO;
@Slf4j
@Service
@RequiredArgsConstructor
public class WellbeingService {

    private final EmployeeWellbeingRepository employeeWellbeingRepository;
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

    public WellbeingStats getStats() {
        List<EmployeeWellbeing> all = employeeWellbeingRepository.findAll();
        
        if (all.isEmpty()) {
            return WellbeingStats.builder()
                    .totalCheckins(0)
                    .averageScore(0.0)
                    .sentimentDistribution(java.util.Collections.emptyMap())
                    .highRiskCount(0)
                    .totalEapRequests(0)
                    .eapRequests(java.util.Collections.emptyList())
                    .build();
        }

        double averageScore = all.stream()
                .mapToInt(EmployeeWellbeing::getScore)
                .average()
                .orElse(0.0);

        java.util.Map<String, Long> sentimentMap = all.stream()
                .filter(w -> w.getSentiment() != null)
                .collect(java.util.stream.Collectors.groupingBy(EmployeeWellbeing::getSentiment, java.util.stream.Collectors.counting()));

        long highRiskCount = all.stream()
                .filter(w -> "HIGH".equalsIgnoreCase(w.getRiskLevel()))
                .count();

        List<EapRequestDTO> eapRequests = employeeWellbeingRepository.findByWantsEapContactTrueOrderByCreatedAtDesc().stream()
                .map(w -> EapRequestDTO.builder()
                        .employeeId(w.getEmployeeId())
                        .score(w.getScore())
                        .notes(w.getNotes())
                        .riskLevel(w.getRiskLevel())
                        .createdAt(w.getCreatedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return WellbeingStats.builder()
                .totalCheckins(all.size())
                .averageScore(averageScore)
                .sentimentDistribution(sentimentMap)
                .highRiskCount(highRiskCount)
                .totalEapRequests(eapRequests.size())
                .eapRequests(eapRequests)
                .build();
    }
}
