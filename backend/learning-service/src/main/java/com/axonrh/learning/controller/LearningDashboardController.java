package com.axonrh.learning.controller;

import com.axonrh.learning.entity.enums.EnrollmentStatus;
import com.axonrh.learning.repository.EnrollmentRepository;
import com.axonrh.learning.service.dto.LearningDashboardDTO;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/learning/dashboard")
@RequiredArgsConstructor
@Slf4j
public class LearningDashboardController {

    private final EnrollmentRepository enrollmentRepository;

    @GetMapping("/stats")
    public ResponseEntity<LearningDashboardDTO> getDashboardStats(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        
        log.info("Fetching learning dashboard stats for tenant: {}", tenantId);
        LearningDashboardDTO stats = new LearningDashboardDTO();

        // 1. Total Active Enrollments
        stats.setTotalActiveEnrollments(enrollmentRepository.countActiveByTenant(tenantId));

        // 2. Completions This Month
        LocalDateTime startOfMonth = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = YearMonth.now().atEndOfMonth().atTime(LocalTime.MAX);
        stats.setCompletionsThisMonth(
            enrollmentRepository.countCompletedByTenantAndDateRange(tenantId, startOfMonth, endOfMonth)
        );

        // 3. Average Progress (Active)
        Double avgProgress = enrollmentRepository.calculateTenantAverageProgress(tenantId);
        stats.setAverageProgress(avgProgress != null ? avgProgress : 0.0);

        // 4. Total Training Hours (Completed)
        Long totalMinutes = enrollmentRepository.sumCompletedDurationMinutes(tenantId);
        stats.setTotalTrainingHours(totalMinutes != null ? totalMinutes / 60.0 : 0.0);

        // 5. Status Distribution
        List<Object[]> statusCounts = enrollmentRepository.countByStatusGrouped(tenantId);
        Map<String, Long> distribution = new HashMap<>();
        for (Object[] row : statusCounts) {
            EnrollmentStatus status = (EnrollmentStatus) row[0];
            Long count = (Long) row[1];
            distribution.put(status.name(), count);
        }
        stats.setStatusDistribution(distribution);

        // 6. Monthly Activity (Last 6 months)
        List<LearningDashboardDTO.MonthlyMetric> monthlyMetrics = new ArrayList<>();
        YearMonth current = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = current.minusMonths(i);
            LocalDateTime start = month.atDay(1).atStartOfDay();
            LocalDateTime end = month.atEndOfMonth().atTime(LocalTime.MAX);
            
            long completions = enrollmentRepository.countCompletedByTenantAndDateRange(tenantId, start, end);
            long enrollments = enrollmentRepository.countEnrolledByTenantAndDateRange(tenantId, start, end);
            
            // Format month name (e.g., "Jan", "Feb") - simplistic approach or use Locale
            String monthName = month.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, new Locale("pt", "BR"));
            monthlyMetrics.add(new LearningDashboardDTO.MonthlyMetric(monthName, completions, enrollments));
        }
        stats.setMonthlyActivity(monthlyMetrics);

        return ResponseEntity.ok(stats);
    }
}
