package com.axonrh.ai.controller;

import com.axonrh.ai.entity.AiFeedback;
import com.axonrh.ai.repository.AiFeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final AiFeedbackRepository feedbackRepository;

    @PostMapping
    public ResponseEntity<AiFeedback> submitFeedback(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody FeedbackRequest request) {

        AiFeedback.FeedbackType type = request.getRating() >= 4 ?
                AiFeedback.FeedbackType.POSITIVE :
                request.getRating() <= 2 ?
                        AiFeedback.FeedbackType.NEGATIVE :
                        AiFeedback.FeedbackType.NEUTRAL;

        AiFeedback feedback = AiFeedback.builder()
                .tenantId(tenantId)
                .userId(userId)
                .conversationId(request.getConversationId())
                .messageId(request.getMessageId())
                .rating(request.getRating())
                .feedbackType(type)
                .feedbackText(request.getFeedbackText())
                .categories(request.getCategories())
                .metadata(request.getMetadata())
                .build();

        feedback = feedbackRepository.save(feedback);
        return ResponseEntity.ok(feedback);
    }

    @GetMapping
    public ResponseEntity<Page<AiFeedback>> listFeedback(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            Pageable pageable) {

        Page<AiFeedback> feedback = feedbackRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
        return ResponseEntity.ok(feedback);
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<List<AiFeedback>> getFeedbackByConversation(
            @PathVariable String conversationId) {

        List<AiFeedback> feedback = feedbackRepository.findByConversationId(conversationId);
        return ResponseEntity.ok(feedback);
    }

    @GetMapping("/stats")
    public ResponseEntity<FeedbackStats> getStats(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(defaultValue = "30") int days) {

        Instant start = Instant.now().minus(days, ChronoUnit.DAYS);
        Instant end = Instant.now();

        Double avgRating = feedbackRepository.getAverageRating(tenantId, start, end);
        long positive = feedbackRepository.countPositiveFeedback(tenantId);
        long negative = feedbackRepository.countNegativeFeedback(tenantId);

        FeedbackStats stats = new FeedbackStats();
        stats.setAverageRating(avgRating != null ? avgRating : 0.0);
        stats.setPositiveCount(positive);
        stats.setNegativeCount(negative);
        stats.setSatisfactionRate(positive + negative > 0 ?
                (double) positive / (positive + negative) * 100 : 0.0);

        return ResponseEntity.ok(stats);
    }

    @lombok.Data
    public static class FeedbackRequest {
        private String conversationId;
        private String messageId;
        private int rating;
        private String feedbackText;
        private List<String> categories;
        private Map<String, Object> metadata;
    }

    @lombok.Data
    public static class FeedbackStats {
        private double averageRating;
        private long positiveCount;
        private long negativeCount;
        private double satisfactionRate;
    }
}
