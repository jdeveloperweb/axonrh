package com.axonrh.employee.service;

import com.axonrh.employee.client.AiAssistantClient;
import com.axonrh.employee.client.WellbeingAnalysisRequest;
import com.axonrh.employee.client.WellbeingAnalysisResponse;
import com.axonrh.employee.dto.WellbeingCheckInRequest;
import com.axonrh.employee.entity.EmployeeWellbeing;
import com.axonrh.employee.repository.EmployeeWellbeingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WellbeingService {

    private final EmployeeWellbeingRepository repository;
    private final AiAssistantClient aiClient;

    public void processCheckIn(WellbeingCheckInRequest request) {
        EmployeeWellbeing.EmployeeWellbeingBuilder builder = EmployeeWellbeing.builder()
                .employeeId(request.getEmployeeId())
                .score(request.getScore())
                .notes(request.getNotes())
                .wantsEapContact(request.isWantsEapContact())
                .source(request.getSource())
                .createdAt(LocalDateTime.now());

        String sentiment = "NEUTRAL";
        String riskLevel = "LOW";
        String keywords = "";

        // Call AI Service for analysis
        try {
            WellbeingAnalysisResponse analysis = aiClient.analyzeWellbeing(
                    WellbeingAnalysisRequest.builder()
                            .text(request.getNotes())
                            .score(request.getScore())
                            .build()
            );
            if (analysis != null) {
                sentiment = analysis.getSentiment();
                riskLevel = analysis.getRiskLevel();
                keywords = analysis.getKeywords();
            }
        } catch (Exception e) {
            log.error("Failed to analyze wellbeing with AI service", e);
            // Fallback heuristics
            if (request.getScore() <= 2) {
                sentiment = "NEGATIVE";
                riskLevel = "MEDIUM";
            } else if (request.getScore() >= 4) {
                sentiment = "POSITIVE";
            }
        }

        // Manual override if EAP requested
        if (request.isWantsEapContact()) {
            riskLevel = "HIGH";
        }

        builder.sentiment(sentiment)
                .riskLevel(riskLevel)
                .keywords(keywords);

        repository.save(builder.build());
    }

    public List<EmployeeWellbeing> getHistory(UUID employeeId) {
        return repository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }
}
