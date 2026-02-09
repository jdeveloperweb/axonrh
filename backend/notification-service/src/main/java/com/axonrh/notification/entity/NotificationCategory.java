package com.axonrh.notification.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    private String icon;

    private String color;

    @Column(name = "default_email_enabled")
    private boolean defaultEmailEnabled = true;

    @Column(name = "default_push_enabled")
    private boolean defaultPushEnabled = true;

    @Column(name = "default_in_app_enabled")
    private boolean defaultInAppEnabled = true;

    @Column(name = "is_system")
    private boolean isSystem = false;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "display_order")
    private int displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
