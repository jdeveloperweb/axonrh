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
import java.util.*;
import java.util.stream.Collectors;
import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.EapRequestDTO;
import com.axonrh.employee.dto.WellbeingStats;
import com.axonrh.employee.repository.EmployeeRepository;
import com.axonrh.employee.entity.Employee;

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
        log.info("Processing check-in for request ID: {} with Tenant: {}", request.getEmployeeId(), tenantId);

        // Obtem o colaborador para garantir existência e consistência do tenant (busca por ID ou UserID)
        Optional<Employee> empOpt = employeeRepository.findByTenantIdAndId(tenantId, request.getEmployeeId())
                .or(() -> employeeRepository.findByTenantIdAndUserId(tenantId, request.getEmployeeId()));

        if (empOpt.isEmpty()) {
            // Tenta buscar por email do token JWT como fallback
            String email = getEmailFromContext();
            if (email != null) {
                log.info("Employee not found by ID, trying fallback email: {}", email);
                empOpt = employeeRepository.findByTenantIdAndEmail(tenantId, email);
            }
        }

        Employee employee = empOpt
                .orElseThrow(() -> new IllegalArgumentException("Colaborador não encontrado: " + request.getEmployeeId()));
        
        log.info("Check-in processed. Resolved Employee ID: {}", employee.getId());

        EmployeeWellbeing.EmployeeWellbeingBuilder builder = EmployeeWellbeing.builder()
                .tenantId(tenantId)
                // Use o ID resolvido da entidade Employee, nao o user ID do request
                .employeeId(employee.getId())
                .score(request.getScore())
                .notes(request.getNotes())
                .wantsEapContact(request.isWantsEapContact())
                .source(request.getSource() != null ? request.getSource() : "WEB")
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
        
        EmployeeWellbeing saved = repository.save(builder.build());
        log.info("Wellbeing record saved with ID: {} for Employee ID: {}", saved.getId(), saved.getEmployeeId());
    }

    public List<EmployeeWellbeing> getHistory(UUID idOrUserId) {
        UUID tenantId = getTenantId();
        log.info("Fetching history for ID: {} with Tenant: {}", idOrUserId, tenantId);

        // Resolve o ID para garantir que estamos buscando pelo Employee ID correto
        // Frontend pode enviar User ID ou Employee ID
        UUID resolvedEmployeeId = employeeRepository.findByTenantIdAndId(tenantId, idOrUserId)
                .map(Employee::getId)
                .or(() -> employeeRepository.findByTenantIdAndUserId(tenantId, idOrUserId)
                        .map(Employee::getId))
                // Fallback: assume que o ID passado eh o proprio Employee ID
                .orElse(idOrUserId);
        
        log.info("Resolved Employee ID for history lookup: {}", resolvedEmployeeId);

        return repository.findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(tenantId, resolvedEmployeeId);
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
                .sorted(Comparator.comparing(EmployeeWellbeing::getCreatedAt).reversed())
                .map(w -> {
                    String name = employeeRepository.findById(w.getEmployeeId())
                            .map(Employee::getFullName)
                            .orElse("Desconhecido");
                    return EapRequestDTO.builder()
                            .employeeId(w.getEmployeeId())
                            .employeeName(name)
                            .score(w.getScore())
                            .notes(w.getNotes())
                            .riskLevel(w.getRiskLevel())
                            .createdAt(w.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());

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
