package com.axonrh.learning.entity;

import com.axonrh.learning.entity.enums.CourseStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "learning_paths")
@Getter
@Setter
public class LearningPath {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String objectives;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseStatus status = CourseStatus.DRAFT;

    @Column(name = "is_mandatory")
    private boolean isMandatory = false;

    @OneToMany(mappedBy = "learningPath", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequenceOrder ASC")
    private List<LearningPathCourse> courses = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void addCourse(LearningPathCourse course) {
        course.setLearningPath(this);
        course.setSequenceOrder(courses.size() + 1);
        courses.add(course);
    }

    public void removeCourse(LearningPathCourse course) {
        courses.remove(course);
    }
}
