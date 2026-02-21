package com.axonrh.employee.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime date;

    private String location;

    @Column(length = 512)
    private String url;

    @Builder.Default
    private String category = "GENERAL";

    @Builder.Default
    private String status = "UPCOMING";

    // Speaker info
    @Column(name = "speaker_name")
    private String speakerName;

    @Column(name = "speaker_role")
    private String speakerRole;

    @Column(name = "speaker_bio", columnDefinition = "TEXT")
    private String speakerBio;

    @Column(name = "speaker_linkedin")
    private String speakerLinkedin;

    @Column(name = "speaker_avatar_url", length = 512)
    private String speakerAvatarUrl;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EventResource> resources = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EventRegistration> registrations = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
