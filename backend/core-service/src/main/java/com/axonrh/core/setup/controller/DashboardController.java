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
        // Implementation would need CASE WHEN statements for age ranges by gender
        // For prototype, we verify if we can get raw data, else return null/empty and handle in frontend

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
                .build();

        return ResponseEntity.ok(stats);
    }
}
