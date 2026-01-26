package com.axonrh.learning.service;

import com.axonrh.learning.entity.Course;
import com.axonrh.learning.entity.Enrollment;
import com.axonrh.learning.entity.Lesson;
import com.axonrh.learning.entity.LessonProgress;
import com.axonrh.learning.entity.enums.EnrollmentStatus;
import com.axonrh.learning.repository.EnrollmentRepository;
import com.axonrh.learning.repository.CourseRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                            CourseRepository courseRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
    }

    // ==================== Enrollment ====================

    public Enrollment enroll(UUID tenantId, UUID courseId, UUID employeeId, String employeeName, LocalDate dueDate) {
        // Verificar se ja esta matriculado
        if (enrollmentRepository.existsByTenantIdAndCourseIdAndEmployeeId(tenantId, courseId, employeeId)) {
            throw new IllegalStateException("Colaborador ja esta matriculado neste curso");
        }

        Course course = courseRepository.findByTenantIdAndId(tenantId, courseId)
                .orElseThrow(() -> new EntityNotFoundException("Curso nao encontrado"));

        Enrollment enrollment = new Enrollment();
        enrollment.setTenantId(tenantId);
        enrollment.setCourse(course);
        enrollment.setEmployeeId(employeeId);
        enrollment.setEmployeeName(employeeName);
        enrollment.setDueDate(dueDate);

        // Se curso requer aprovacao, status fica pendente
        if (course.getRequiresApproval()) {
            enrollment.setStatus(EnrollmentStatus.ENROLLED);
        }

        return enrollmentRepository.save(enrollment);
    }

    public Enrollment get(UUID tenantId, UUID enrollmentId) {
        return enrollmentRepository.findByTenantIdAndId(tenantId, enrollmentId)
                .orElseThrow(() -> new EntityNotFoundException("Matricula nao encontrada"));
    }

    public List<Enrollment> getByEmployee(UUID tenantId, UUID employeeId) {
        return enrollmentRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
    }

    public List<Enrollment> getActiveByEmployee(UUID tenantId, UUID employeeId) {
        return enrollmentRepository.findActiveByEmployee(tenantId, employeeId);
    }

    public Page<Enrollment> getByCourse(UUID tenantId, UUID courseId, Pageable pageable) {
        return enrollmentRepository.findByTenantIdAndCourseId(tenantId, courseId, pageable);
    }

    public List<Enrollment> getOverdue(UUID tenantId) {
        return enrollmentRepository.findOverdue(tenantId, LocalDate.now());
    }

    // ==================== Progress ====================

    public Enrollment startCourse(UUID tenantId, UUID enrollmentId) {
        Enrollment enrollment = get(tenantId, enrollmentId);
        enrollment.start();
        return enrollmentRepository.save(enrollment);
    }

    public Enrollment updateLessonProgress(UUID tenantId, UUID enrollmentId, UUID lessonId,
                                           String status, Integer timeSpent, Integer videoPosition) {
        Enrollment enrollment = get(tenantId, enrollmentId);

        LessonProgress progress = enrollment.getLessonProgresses().stream()
                .filter(lp -> lp.getLesson().getId().equals(lessonId))
                .findFirst()
                .orElseGet(() -> {
                    Lesson lesson = findLesson(enrollment.getCourse(), lessonId);
                    LessonProgress newProgress = new LessonProgress();
                    newProgress.setEnrollment(enrollment);
                    newProgress.setLesson(lesson);
                    enrollment.getLessonProgresses().add(newProgress);
                    return newProgress;
                });

        if ("IN_PROGRESS".equals(status)) {
            progress.start();
        } else if ("COMPLETED".equals(status)) {
            progress.complete();
        }

        if (timeSpent != null) {
            progress.updateTimeSpent(timeSpent);
        }
        if (videoPosition != null) {
            progress.updateVideoPosition(videoPosition);
        }

        enrollment.updateProgress();
        return enrollmentRepository.save(enrollment);
    }

    private Lesson findLesson(Course course, UUID lessonId) {
        return course.getModules().stream()
                .flatMap(m -> m.getLessons().stream())
                .filter(l -> l.getId().equals(lessonId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Licao nao encontrada"));
    }

    public Enrollment completeCourse(UUID tenantId, UUID enrollmentId, BigDecimal score) {
        Enrollment enrollment = get(tenantId, enrollmentId);
        enrollment.complete(score);
        return enrollmentRepository.save(enrollment);
    }

    // ==================== Workflow ====================

    public Enrollment approve(UUID tenantId, UUID enrollmentId, UUID approverId) {
        Enrollment enrollment = get(tenantId, enrollmentId);
        enrollment.approve(approverId);
        return enrollmentRepository.save(enrollment);
    }

    public Enrollment cancel(UUID tenantId, UUID enrollmentId, String reason) {
        Enrollment enrollment = get(tenantId, enrollmentId);
        enrollment.cancel(reason);
        return enrollmentRepository.save(enrollment);
    }

    public Enrollment issueCertificate(UUID tenantId, UUID enrollmentId, UUID certificateId) {
        Enrollment enrollment = get(tenantId, enrollmentId);
        enrollment.issueCertificate(certificateId);
        return enrollmentRepository.save(enrollment);
    }

    // ==================== Statistics ====================

    public EnrollmentStatistics getEmployeeStatistics(UUID tenantId, UUID employeeId) {
        long total = enrollmentRepository.countByTenantIdAndEmployeeId(tenantId, employeeId);
        long completed = enrollmentRepository.countByEmployeeAndStatus(tenantId, employeeId, EnrollmentStatus.COMPLETED);
        long inProgress = enrollmentRepository.countByEmployeeAndStatus(tenantId, employeeId, EnrollmentStatus.IN_PROGRESS);

        Double avgProgress = enrollmentRepository.calculateAverageProgress(tenantId, employeeId);
        if (avgProgress == null) avgProgress = 0.0;

        return new EnrollmentStatistics(total, completed, inProgress, avgProgress);
    }

    public record EnrollmentStatistics(
            long total,
            long completed,
            long inProgress,
            double averageProgress
    ) {}
}
