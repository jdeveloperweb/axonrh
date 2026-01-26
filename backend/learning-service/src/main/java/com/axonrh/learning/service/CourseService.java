package com.axonrh.learning.service;

import com.axonrh.learning.entity.Course;
import com.axonrh.learning.entity.CourseModule;
import com.axonrh.learning.entity.Lesson;
import com.axonrh.learning.entity.enums.CourseStatus;
import com.axonrh.learning.repository.CourseRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    // ==================== CRUD ====================

    public Course create(UUID tenantId, Course course) {
        course.setTenantId(tenantId);
        course.setStatus(CourseStatus.DRAFT);
        return courseRepository.save(course);
    }

    public Course get(UUID tenantId, UUID courseId) {
        return courseRepository.findByTenantIdAndId(tenantId, courseId)
                .orElseThrow(() -> new EntityNotFoundException("Curso nao encontrado"));
    }

    public Course update(UUID tenantId, UUID courseId, Course updates) {
        Course course = get(tenantId, courseId);

        if (course.getStatus() == CourseStatus.ARCHIVED) {
            throw new IllegalStateException("Curso arquivado nao pode ser alterado");
        }

        if (updates.getTitle() != null) {
            course.setTitle(updates.getTitle());
        }
        if (updates.getDescription() != null) {
            course.setDescription(updates.getDescription());
        }
        if (updates.getObjectives() != null) {
            course.setObjectives(updates.getObjectives());
        }
        if (updates.getCategoryId() != null) {
            course.setCategoryId(updates.getCategoryId());
        }
        if (updates.getCourseType() != null) {
            course.setCourseType(updates.getCourseType());
        }
        if (updates.getDifficultyLevel() != null) {
            course.setDifficultyLevel(updates.getDifficultyLevel());
        }
        if (updates.getThumbnailUrl() != null) {
            course.setThumbnailUrl(updates.getThumbnailUrl());
        }
        if (updates.getPassingScore() != null) {
            course.setPassingScore(updates.getPassingScore());
        }

        return courseRepository.save(course);
    }

    public void delete(UUID tenantId, UUID courseId) {
        Course course = get(tenantId, courseId);
        if (course.getStatus() != CourseStatus.DRAFT) {
            throw new IllegalStateException("Apenas cursos em rascunho podem ser excluidos");
        }
        courseRepository.delete(course);
    }

    // ==================== Listing ====================

    public Page<Course> list(UUID tenantId, Pageable pageable) {
        return courseRepository.findByTenantId(tenantId, pageable);
    }

    public List<Course> listPublished(UUID tenantId) {
        return courseRepository.findByTenantIdAndStatus(tenantId, CourseStatus.PUBLISHED);
    }

    public List<Course> listByCategory(UUID tenantId, UUID categoryId) {
        return courseRepository.findByTenantIdAndCategoryId(tenantId, categoryId);
    }

    public List<Course> listMandatory(UUID tenantId) {
        return courseRepository.findByTenantIdAndIsMandatoryTrue(tenantId);
    }

    public Page<Course> search(UUID tenantId, String query, Pageable pageable) {
        return courseRepository.searchByTitle(tenantId, query, pageable);
    }

    // ==================== Status ====================

    public Course publish(UUID tenantId, UUID courseId) {
        Course course = get(tenantId, courseId);
        course.publish();
        return courseRepository.save(course);
    }

    public Course archive(UUID tenantId, UUID courseId) {
        Course course = get(tenantId, courseId);
        course.archive();
        return courseRepository.save(course);
    }

    // ==================== Modules ====================

    public Course addModule(UUID tenantId, UUID courseId, CourseModule module) {
        Course course = get(tenantId, courseId);
        course.addModule(module);
        return courseRepository.save(course);
    }

    public Course removeModule(UUID tenantId, UUID courseId, UUID moduleId) {
        Course course = get(tenantId, courseId);
        course.getModules().removeIf(m -> m.getId().equals(moduleId));
        return courseRepository.save(course);
    }

    public Course updateModule(UUID tenantId, UUID courseId, UUID moduleId, CourseModule updates) {
        Course course = get(tenantId, courseId);
        CourseModule module = course.getModules().stream()
                .filter(m -> m.getId().equals(moduleId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Modulo nao encontrado"));

        if (updates.getTitle() != null) {
            module.setTitle(updates.getTitle());
        }
        if (updates.getDescription() != null) {
            module.setDescription(updates.getDescription());
        }

        return courseRepository.save(course);
    }

    // ==================== Lessons ====================

    public Course addLesson(UUID tenantId, UUID courseId, UUID moduleId, Lesson lesson) {
        Course course = get(tenantId, courseId);
        CourseModule module = course.getModules().stream()
                .filter(m -> m.getId().equals(moduleId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Modulo nao encontrado"));

        module.addLesson(lesson);
        return courseRepository.save(course);
    }

    public Course removeLesson(UUID tenantId, UUID courseId, UUID moduleId, UUID lessonId) {
        Course course = get(tenantId, courseId);
        CourseModule module = course.getModules().stream()
                .filter(m -> m.getId().equals(moduleId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Modulo nao encontrado"));

        module.getLessons().removeIf(l -> l.getId().equals(lessonId));
        module.recalculateDuration();
        return courseRepository.save(course);
    }

    // ==================== Statistics ====================

    public CourseStatistics getStatistics(UUID tenantId, UUID courseId) {
        Course course = get(tenantId, courseId);

        int totalModules = course.getModules().size();
        int totalLessons = course.getTotalLessons();
        int totalDuration = course.getDurationMinutes() != null ? course.getDurationMinutes() : 0;
        boolean hasQuiz = course.hasQuiz();

        // Outros dados viriam de consultas agregadas
        return new CourseStatistics(
                totalModules,
                totalLessons,
                totalDuration,
                hasQuiz,
                0, // total enrollments
                0, // completions
                0.0 // completion rate
        );
    }

    public record CourseStatistics(
            int totalModules,
            int totalLessons,
            int totalDurationMinutes,
            boolean hasQuiz,
            long totalEnrollments,
            long completions,
            double completionRate
    ) {}
}
