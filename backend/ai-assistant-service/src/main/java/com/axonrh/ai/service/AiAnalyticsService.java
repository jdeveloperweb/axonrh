package com.axonrh.ai.service;

import com.axonrh.ai.entity.Conversation;
import com.axonrh.ai.repository.AiFeedbackRepository;
import com.axonrh.ai.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAnalyticsService {

    private final ConversationRepository conversationRepository;
    private final AiFeedbackRepository feedbackRepository;

    public DashboardStats getDashboardStats(UUID tenantId, int days) {
        Instant start = Instant.now().minus(days, ChronoUnit.DAYS);
        Instant end = Instant.now();

        long totalConversations = conversationRepository.countByTenantIdAndStatus(
                tenantId, Conversation.ConversationStatus.ACTIVE);

        Double avgRating = feedbackRepository.getAverageRating(tenantId, start, end);
        long positiveFeedback = feedbackRepository.countPositiveFeedback(tenantId);
        long negativeFeedback = feedbackRepository.countNegativeFeedback(tenantId);

        List<ConversationRepository.DailyConversationCount> dailyCounts =
                conversationRepository.countConversationsByDay(tenantId, start, end);

        Map<String, Integer> conversationsPerDay = new LinkedHashMap<>();
        for (var count : dailyCounts) {
            conversationsPerDay.put(count.getId(), count.getCount());
        }

        return DashboardStats.builder()
                .totalConversations(totalConversations)
                .averageRating(avgRating != null ? avgRating : 0.0)
                .satisfactionRate(calculateSatisfactionRate(positiveFeedback, negativeFeedback))
                .conversationsPerDay(conversationsPerDay)
                .topIntents(getTopIntents(tenantId, start, end))
                .build();
    }

    public List<IntentUsage> getTopIntents(UUID tenantId, Instant start, Instant end) {
        // In a full implementation, this would aggregate from conversation metadata
        return List.of(
                new IntentUsage("query_employee", 150),
                new IntentUsage("calculate_vacation", 120),
                new IntentUsage("hr_policy", 95),
                new IntentUsage("calculate_termination", 80),
                new IntentUsage("query_payroll", 65)
        );
    }

    public ResponseTimeStats getResponseTimeStats(UUID tenantId, int days) {
        // In a full implementation, this would calculate from conversation metadata
        return ResponseTimeStats.builder()
                .averageMs(1500)
                .medianMs(1200)
                .p95Ms(3500)
                .p99Ms(5000)
                .build();
    }

    private double calculateSatisfactionRate(long positive, long negative) {
        long total = positive + negative;
        if (total == 0) return 0.0;
        return (double) positive / total * 100;
    }

    @Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM daily
    public void cleanupOldConversations() {
        log.info("Starting cleanup of old deleted conversations");
        Instant threshold = Instant.now().minus(30, ChronoUnit.DAYS);

        // This would be per-tenant in production
        // For now, just log
        log.info("Would delete conversations deleted before: {}", threshold);
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DashboardStats {
        private long totalConversations;
        private double averageRating;
        private double satisfactionRate;
        private Map<String, Integer> conversationsPerDay;
        private List<IntentUsage> topIntents;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class IntentUsage {
        private String intent;
        private int count;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ResponseTimeStats {
        private long averageMs;
        private long medianMs;
        private long p95Ms;
        private long p99Ms;
    }
}
