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
        
        // 1. Total de Colaboradores Ativos
        Long activeEmployees = 0L;
        try {
            activeEmployees = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM employees WHERE tenant_id = ? AND is_active = true")
                .setParameter(1, tId)
                .getSingleResult()).longValue();
        } catch (Exception e) {
            log.warn("Falha ao buscar contagem de colaboradores: {}", e.getMessage());
        }

        // 2. Presentes Hoje (Simulado baseando em batidas de ponto se o módulo existir)
        Long presentsToday = (long)(activeEmployees * 0.95); // Default 95%
        try {
            presentsToday = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(DISTINCT employee_id) FROM time_records " +
                "WHERE tenant_id = ? AND punch_date = CURRENT_DATE")
                .setParameter(1, tId)
                .getSingleResult()).longValue();
        } catch (Exception e) {
            // Tabela pode não existir ainda
        }

        // 3. Férias este Mês
        Long vacationsCount = 0L;
        try {
            vacationsCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM vacations " +
                "WHERE tenant_id = ? AND status = 'APPROVED' " +
                "AND (start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE)")
                .setParameter(1, tId)
                .getSingleResult()).longValue();
        } catch (Exception e) {
            // Tabela pode não existir ainda
        }

        // 4. Pendências (Ajustes de ponto ou solicitações de férias pendentes)
        Long pendingIssues = 0L;
        try {
            Long pendingAdjustments = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM time_adjustments WHERE tenant_id = ? AND status = 'PENDING'")
                .setParameter(1, tId)
                .getSingleResult()).longValue();
            
            Long pendingVacations = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM vacations WHERE tenant_id = ? AND status = 'PENDING'")
                .setParameter(1, tId)
                .getSingleResult()).longValue();
                
            pendingIssues = pendingAdjustments + pendingVacations;
        } catch (Exception e) {
            // Tabelas podem não existir ainda
        }

        DashboardStatsDTO stats = DashboardStatsDTO.builder()
                .totalEmployees(activeEmployees.intValue())
                .presentToday(presentsToday)
                .vacationsThisMonth(vacationsCount.intValue())
                .pendingIssues(pendingIssues.intValue())
                .employeeChange(0.0) // Poderia ser calculado comparando com mês anterior
                .presenceChange(0.0)
                .pendingChange(0.0)
                .build();

        return ResponseEntity.ok(stats);
    }
}
