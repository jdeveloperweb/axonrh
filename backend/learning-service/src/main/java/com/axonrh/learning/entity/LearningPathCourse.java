package com.axonrh.learning.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "learning_path_courses")
@Getter
@Setter
public class LearningPathCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "path_id", nullable = false)
    private LearningPath learningPath;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "sequence_order")
    private int sequenceOrder;

    @Column(name = "is_required")
    private boolean isRequired = true;

    @Column(name = "unlock_after_days")
    private int unlockAfterDays = 0;
}
