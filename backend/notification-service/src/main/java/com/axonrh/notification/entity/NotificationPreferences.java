package com.axonrh.notification.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "employee_id")
    private UUID employeeId;

    // Email preferences
    @Builder.Default
    @Column(name = "email_enabled")
    private boolean emailEnabled = true;

    @Builder.Default
    @Column(name = "email_digest_frequency")
    @Enumerated(EnumType.STRING)
    private DigestFrequency emailDigestFrequency = DigestFrequency.INSTANT;

    @Builder.Default
    @Column(name = "email_digest_time")
    private LocalTime emailDigestTime = LocalTime.of(9, 0);

    // Push preferences
    @Builder.Default
    @Column(name = "push_enabled")
    private boolean pushEnabled = true;

    @Builder.Default
    @Column(name = "push_sound_enabled")
    private boolean pushSoundEnabled = true;

    @Builder.Default
    @Column(name = "push_vibration_enabled")
    private boolean pushVibrationEnabled = true;

    // In-app preferences
    @Builder.Default
    @Column(name = "in_app_enabled")
    private boolean inAppEnabled = true;

    @Builder.Default
    @Column(name = "in_app_sound_enabled")
    private boolean inAppSoundEnabled = false;

    // Quiet hours
    @Builder.Default
    @Column(name = "quiet_hours_enabled")
    private boolean quietHoursEnabled = false;

    @Builder.Default
    @Column(name = "quiet_hours_start")
    private LocalTime quietHoursStart = LocalTime.of(22, 0);

    @Builder.Default
    @Column(name = "quiet_hours_end")
    private LocalTime quietHoursEnd = LocalTime.of(7, 0);

    // Category preferences
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "category_preferences", columnDefinition = "jsonb")
    private Map<String, CategoryPreference> categoryPreferences;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum DigestFrequency {
        INSTANT, DAILY, WEEKLY
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryPreference {
        private boolean email = true;
        private boolean push = true;
        private boolean inApp = true;
    }
}
