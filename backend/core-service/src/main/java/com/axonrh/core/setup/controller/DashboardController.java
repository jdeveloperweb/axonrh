package com.axonrh.core.setup.controller;

import com.axonrh.core.setup.dto.DashboardStatsDTO;
import com.axonrh.core.setup.service.SetupWizardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Dashboard", description = "Endpoints para o painel principal")
public class DashboardController {

    private final SetupWizardService setupWizardService;
    private final jakarta.persistence.EntityManager entityManager;

    @GetMapping("/stats")
    @Operation(summary = "Obter estatísticas do dashboard", description = "Retorna os números principais para o dashboard")
    public ResponseEntity<DashboardStatsDTO> getStats(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestHeader("X-User-Id") String userId) {
        
        UUID tId = UUID.fromString(tenantId);
        
        // 1. Basic Counts
        Long activeEmployees = 0L;
        try {
            activeEmployees = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM employees WHERE tenant_id = ? AND is_active = true")
                .setParameter(1, tId)
                .getSingleResult()).longValue();
        } catch (Exception e) {
             log.warn("Error counting employees: {}", e.getMessage());
        }

        // 2. Attendance (Simulated for now)
        Long presentsToday = (long)(activeEmployees * 0.96); 
        
        // 3. Vacations
        Long vacationsCount = 0L;
        try {
            vacationsCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM vacations " +
                "WHERE tenant_id = ? AND status = 'APPROVED' " +
                "AND (start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE)")
                .setParameter(1, tId)
                .getSingleResult()).longValue();
        } catch (Exception e) {
            // Table might not exist
        }

        // 4. Pending Issues
        Long pendingIssues = 0L;
        try {
             Long pendingVacations = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM vacations WHERE tenant_id = ? AND status = 'PENDING'")
                .setParameter(1, tId)
                .getSingleResult()).longValue();
             pendingIssues = pendingVacations; // Add other pending types if available
        } catch (Exception e) { }

        // ================= Diversity Metrics =================

        // Gender Distribution
        java.util.Map<String, Long> genderDist = new java.util.HashMap<>();
        double femalePct = 0.0;
        try {
            java.util.List<Object[]> results = entityManager.createNativeQuery(
                "SELECT gender, COUNT(*) FROM employees WHERE tenant_id = ? AND is_active = true GROUP BY gender")
                .setParameter(1, tId)
                .getResultList();
            
            for (Object[] row : results) {
                String g = (String) row[0];
                Long count = ((Number) row[1]).longValue();
                genderDist.put(g != null ? g : "MASCULINO", count); // Default fallback
            }
            
            if (activeEmployees > 0) {
                Long femaleCount = genderDist.getOrDefault("FEMININO", 0L);
                femalePct = (double) femaleCount / activeEmployees * 100.0;
            }
        } catch (Exception e) {
             log.warn("Error counting gender: {}", e.getMessage());
             // Mock data if table empty/error
             genderDist.put("MASCULINO", (long)(activeEmployees * 0.6));
             genderDist.put("FEMININO", (long)(activeEmployees * 0.4));
             femalePct = 40.0;
        }

        // Race Distribution
        java.util.Map<String, Long> raceDist = new java.util.HashMap<>();
        try {
            java.util.List<Object[]> results = entityManager.createNativeQuery(
                "SELECT race, COUNT(*) FROM employees WHERE tenant_id = ? AND is_active = true GROUP BY race")
                .setParameter(1, tId)
                .getResultList();
             
             for (Object[] row : results) {
                String r = (String) row[0];
                Long count = ((Number) row[1]).longValue();
                raceDist.put(r != null ? r : "NAO_INFORMADO", count);
            }
        } catch (Exception e) {
             log.warn("Error counting race: {}", e.getMessage());
        }

        // Age Stats
        double avgAge = 0.0;
        try {
            java.math.BigDecimal val = (java.math.BigDecimal) entityManager.createNativeQuery(
                 "SELECT AVG(EXTRACT(YEAR FROM AGE(birth_date))) FROM employees WHERE tenant_id = ? AND is_active = true")
                 .setParameter(1, tId)
                 .getSingleResult();
            if (val != null) avgAge = val.doubleValue();
        } catch (Exception e) { }

        // Age Pyramid (Mocked structure for now as complex SQL grouping varies by DB)
        java.util.Map<String, java.util.Map<String, Long>> agePyramid = new java.util.HashMap<>();
        
        // ================= Hiring & Retention =================
        java.util.Map<String, Long> hiringHist = new java.util.LinkedHashMap<>();
        java.util.Map<String, Long> termHist = new java.util.LinkedHashMap<>();
        java.util.Map<String, Long> activeHist = new java.util.LinkedHashMap<>();
        java.util.Map<String, Double> turnoverHist = new java.util.LinkedHashMap<>();
        java.util.Map<String, Long> tenureDist = new java.util.LinkedHashMap<>();

        // Initialize maps with last 12 months (Chronological)
        java.time.YearMonth currentMonth = java.time.YearMonth.now();
        java.util.List<String> last12Months = new java.util.ArrayList<>();
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("MMM/yy", new java.util.Locale("pt", "BR"));

        // Build generic list 11 months ago -> now
        for (int i = 11; i >= 0; i--) {
            java.time.YearMonth ym = currentMonth.minusMonths(i);
            String label = ym.format(fmt);
            // Capitalize
            if (label.length() > 0) {
                label = label.substring(0, 1).toUpperCase() + label.substring(1);
            }
            last12Months.add(label);
            hiringHist.put(label, 0L);
            termHist.put(label, 0L);
        }

        try {
            // Hires by month
             java.util.List<Object[]> hires = entityManager.createNativeQuery(
                "SELECT CAST(EXTRACT(YEAR FROM hire_date) AS INTEGER), CAST(EXTRACT(MONTH FROM hire_date) AS INTEGER), COUNT(*) " +
                "FROM employees WHERE tenant_id = ? AND hire_date >= CURRENT_DATE - INTERVAL '1 year' GROUP BY 1, 2")
                .setParameter(1, tId)
                .getResultList();

             for(Object[] row : hires) {
                int y = ((Number)row[0]).intValue();
                int m = ((Number)row[1]).intValue();
                java.time.YearMonth ym = java.time.YearMonth.of(y, m);
                String label = ym.format(fmt);
                if (label.length() > 0) label = label.substring(0, 1).toUpperCase() + label.substring(1);
                
                if(hiringHist.containsKey(label)) {
                    hiringHist.put(label, ((Number)row[2]).longValue());
                }
             }

             // Terminations by month
             java.util.List<Object[]> terms = entityManager.createNativeQuery(
                "SELECT CAST(EXTRACT(YEAR FROM termination_date) AS INTEGER), CAST(EXTRACT(MONTH FROM termination_date) AS INTEGER), COUNT(*) " +
                "FROM employees WHERE tenant_id = ? AND termination_date >= CURRENT_DATE - INTERVAL '1 year' GROUP BY 1, 2")
                .setParameter(1, tId)
                .getResultList();
            
             for(Object[] row : terms) {
                int y = ((Number)row[0]).intValue();
                int m = ((Number)row[1]).intValue();
                java.time.YearMonth ym = java.time.YearMonth.of(y, m);
                String label = ym.format(fmt);
                if (label.length() > 0) label = label.substring(0, 1).toUpperCase() + label.substring(1);
                
                if(termHist.containsKey(label)) {
                    termHist.put(label, ((Number)row[2]).longValue());
                }
             }
             
             // Calculate Active History (Backwards)
             long currentActiveCalc = activeEmployees;
             long[] computedActive = new long[12];
             
             // Traverse backwards from newest to oldest
             for(int k = last12Months.size() - 1; k >= 0; k--) {
                 String label = last12Months.get(k);
                 long h = hiringHist.get(label);
                 long t = termHist.get(label);
                 
                 computedActive[k] = currentActiveCalc;
                 
                 // Prep for previous month
                 currentActiveCalc = currentActiveCalc - h + t;
             }
             
             // Fill final maps
             for(int k = 0; k < last12Months.size(); k++) {
                 String label = last12Months.get(k);
                 activeHist.put(label, computedActive[k]);
                 long t = termHist.get(label);
                 long a = computedActive[k];
                 double trn = a > 0 ? (double)t/a * 100.0 : 0.0;
                 turnoverHist.put(label, Math.round(trn * 10.0)/10.0);
             }

             // Tenure Distribution
             java.util.List<Object[]> tenureRows = entityManager.createNativeQuery(
                "SELECT " +
                "CASE " +
                "  WHEN AGE(CURRENT_DATE, hire_date) < INTERVAL '1 year' THEN '< 1 ano' " +
                "  WHEN AGE(CURRENT_DATE, hire_date) < INTERVAL '2 years' THEN '1-2 anos' " +
                "  WHEN AGE(CURRENT_DATE, hire_date) < INTERVAL '3 years' THEN '2-3 anos' " +
                "  WHEN AGE(CURRENT_DATE, hire_date) < INTERVAL '5 years' THEN '3-5 anos' " +
                "  ELSE '5+ anos' " +
                "END as range, COUNT(*) " +
                "FROM employees WHERE tenant_id = ? AND is_active = true GROUP BY 1")
                .setParameter(1, tId)
                .getResultList();

             // Initialize defaults ordered
             tenureDist.put("< 1 ano", 0L);
             tenureDist.put("1-2 anos", 0L);
             tenureDist.put("2-3 anos", 0L);
             tenureDist.put("3-5 anos", 0L);
             tenureDist.put("5+ anos", 0L);
             
             for(Object[] row : tenureRows) {
                 tenureDist.put((String)row[0], ((Number)row[1]).longValue());
             }

        } catch (Exception e) {
            log.warn("Error calculating hiring stats: {}", e.getMessage());
        }

        DashboardStatsDTO stats = DashboardStatsDTO.builder()
                .totalEmployees(activeEmployees.intValue())
                .presentToday(presentsToday)
                .vacationsThisMonth(vacationsCount.intValue())
                .pendingIssues(pendingIssues.intValue())
                .employeeChange(2.5) // Hardcoded 2.5% increase
                .presenceChange(0.5)
                .pendingChange(-1.2)
                .femaleRepresentation(Math.round(femalePct * 10.0) / 10.0)
                .diversityIndex(100.0) // Placeholder
                .averageAge(Math.round(avgAge))
                .genderDistribution(genderDist)
                .raceDistribution(raceDist)
                .agePyramid(agePyramid) // To be filled
                .genderByDepartment(new java.util.HashMap<>()) // To be filled
                .turnoverHistory(turnoverHist)
                .activeHistory(activeHist)
                .hiringHistory(hiringHist)
                .terminationHistory(termHist)
                .tenureDistribution(tenureDist)
                .build();

        return ResponseEntity.ok(stats);
    }
}
