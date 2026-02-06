package com.axonrh.learning.service;

import com.axonrh.learning.entity.Certificate;
import com.axonrh.learning.entity.Course;
import com.axonrh.learning.entity.Enrollment;
import com.axonrh.learning.entity.LearningPath;
import com.axonrh.learning.entity.Lesson;
import com.axonrh.learning.entity.LessonProgress;
import com.axonrh.learning.entity.PathEnrollment;
import com.axonrh.learning.entity.enums.EnrollmentStatus;
import com.axonrh.learning.repository.EnrollmentRepository;
import com.axonrh.learning.repository.CourseRepository;
import com.axonrh.learning.repository.LearningPathRepository;
import com.axonrh.learning.repository.PathEnrollmentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

    @Service
    @Transactional
    public class EnrollmentService {

        private final EnrollmentRepository enrollmentRepository;
        private final CourseRepository courseRepository;
        private final CertificateService certificateService;
        private final PathEnrollmentRepository pathEnrollmentRepository;
        private final LearningPathRepository learningPathRepository;

        public EnrollmentService(EnrollmentRepository enrollmentRepository,
                                CourseRepository courseRepository,
                                CertificateService certificateService,
                                PathEnrollmentRepository pathEnrollmentRepository,
                                LearningPathRepository learningPathRepository) {
            this.enrollmentRepository = enrollmentRepository;
            this.courseRepository = courseRepository;
            this.certificateService = certificateService;
            this.pathEnrollmentRepository = pathEnrollmentRepository;
            this.learningPathRepository = learningPathRepository;
        }

        // ==================== Enrollment ====================

        public Enrollment enroll(UUID tenantId, UUID courseId, UUID employeeId, String employeeName, LocalDate dueDate) {
        // Se ja existe, retorna ela (ser prático)
        Optional<Enrollment> existing = enrollmentRepository.findByTenantIdAndCourseIdAndEmployeeId(tenantId, courseId, employeeId);

        if (existing.isPresent()) {
            Enrollment enrollment = existing.get();
            // Se estava cancelada ou expirada, permite re-inscrever
            if (enrollment.getStatus() == EnrollmentStatus.CANCELLED || enrollment.getStatus() == EnrollmentStatus.EXPIRED) {
                enrollment.setStatus(EnrollmentStatus.ENROLLED);
                enrollment.setEnrolledAt(java.time.LocalDateTime.now());
                enrollment.setCancelledAt(null);
                enrollment.setCancellationReason(null);
                return enrollmentRepository.save(enrollment);
            }
            return enrollment;
        }

        Course course = courseRepository.findByTenantIdAndId(tenantId, courseId)
                .orElseThrow(() -> new EntityNotFoundException("Curso nao encontrado"));

        Enrollment enrollment = new Enrollment();
        enrollment.setTenantId(tenantId);
        enrollment.setCourse(course);
        enrollment.setEmployeeId(employeeId);
        enrollment.setEmployeeName(employeeName);
        enrollment.setDueDate(dueDate);
        enrollment.setEnrolledAt(java.time.LocalDateTime.now());

        // Se curso requer aprovacao, futuramente poderiamos ter um status PENDING
        // Por enquanto, seguimos o fluxo simplificado
        enrollment.setStatus(EnrollmentStatus.ENROLLED);

        return enrollmentRepository.save(enrollment);
    }

        public Enrollment get(UUID tenantId, UUID enrollmentId) {
            return enrollmentRepository.findByTenantIdAndId(tenantId, enrollmentId)
                    .orElseThrow(() -> new EntityNotFoundException("Matricula nao encontrada"));
        }

        public Page<Enrollment> listAll(UUID tenantId, Pageable pageable) {
            return enrollmentRepository.findByTenantId(tenantId, pageable);
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
            
            if (enrollment.getStatus() == EnrollmentStatus.COMPLETED && enrollment.getCertificateId() == null) {
                Certificate certificate = certificateService.generate(tenantId, enrollment);
                enrollment.issueCertificate(certificate.getId());
            }
            
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

        public void delete(UUID tenantId, UUID enrollmentId) {
            Enrollment enrollment = get(tenantId, enrollmentId);
            enrollmentRepository.delete(enrollment);
        }

        // ==================== Learning Paths ====================

        public PathEnrollment enrollInPath(UUID tenantId, UUID pathId, UUID employeeId, String employeeName) {
            // Implementation for path enrollment
            LearningPath path = learningPathRepository.findById(pathId)
                    .filter(p -> p.getTenantId().equals(tenantId))
                    .orElseThrow(() -> new EntityNotFoundException("Trilha de aprendizagem nao encontrada"));

            PathEnrollment pathEnrollment = new PathEnrollment();
            pathEnrollment.setTenantId(tenantId);
            pathEnrollment.setPathId(pathId);
            pathEnrollment.setEmployeeId(employeeId);
            pathEnrollment.setEmployeeName(employeeName);
            pathEnrollment.setEnrolledAt(java.time.LocalDateTime.now());
            pathEnrollment.setStatus(EnrollmentStatus.ENROLLED);

            // Enroll in all required courses of the path
            path.getCourses().forEach(pc -> {
                try {
                    enroll(tenantId, pc.getCourseId(), employeeId, employeeName, null);
                } catch (Exception e) {
                    // Ignore if already enrolled
                }
            });

            return pathEnrollmentRepository.save(pathEnrollment);
        }

        public List<PathEnrollment> getPathEnrollmentsByEmployee(UUID tenantId, UUID employeeId) {
            return pathEnrollmentRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
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

