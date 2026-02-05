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
import java.util.Optional;
import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.EapRequestDTO;
import com.axonrh.employee.dto.WellbeingStats;
import com.axonrh.employee.repository.EmployeeRepository;

import java.util.UUID;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

@Slf4j
@Service
@RequiredArgsConstructor
public class WellbeingService {

    private final EmployeeWellbeingRepository repository;
    private final EmployeeRepository employeeRepository;
    private final AiAssistantClient aiClient;

    public void processCheckIn(WellbeingCheckInRequest request) {
        UUID tenantId = getTenantId();

        // Obtem o colaborador para garantir existência e consistência do tenant (busca por ID ou UserID)
        Optional<com.axonrh.employee.entity.Employee> empOpt = employeeRepository.findByTenantIdAndId(tenantId, request.getEmployeeId())
                .or(() -> employeeRepository.findByTenantIdAndUserId(tenantId, request.getEmployeeId()));

        if (empOpt.isEmpty()) {
            // Tenta buscar por email do token JWT como fallback
            String email = getEmailFromContext();
            if (email != null) {
                empOpt = employeeRepository.findByTenantIdAndEmail(tenantId, email);
            }
        }

        com.axonrh.employee.entity.Employee employee = empOpt
                .orElseThrow(() -> new IllegalArgumentException("Colaborador não encontrado: " + request.getEmployeeId()));

        EmployeeWellbeing.EmployeeWellbeingBuilder builder = EmployeeWellbeing.builder()
                .tenantId(tenantId)
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
        UUID tenantId = getTenantId();
        return repository.findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(tenantId, employeeId);
    }

    public WellbeingStats getStats() {
        UUID tenantId = getTenantId();
        List<EmployeeWellbeing> all = repository.findByTenantId(tenantId);

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

        List<EapRequestDTO> eapRequests = all.stream()
                .filter(EmployeeWellbeing::isWantsEapContact)
                .sorted(java.util.Comparator.comparing(EmployeeWellbeing::getCreatedAt).reversed())
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

    private UUID getTenantId() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null) {
            throw new IllegalStateException("Tenant nao definido no contexto");
        }
        return UUID.fromString(tenant);
    }

    private String getEmailFromContext() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
                Jwt jwt = (Jwt) authentication.getPrincipal();
                // Tenta "email" ou "sub" se for email
                String email = jwt.getClaimAsString("email");
                if (email == null && jwt.getSubject().contains("@")) {
                    email = jwt.getSubject();
                }
                return email;
            }
        } catch (Exception e) {
            log.warn("Could not extract email from context", e);
        }
        return null;
    }
}
