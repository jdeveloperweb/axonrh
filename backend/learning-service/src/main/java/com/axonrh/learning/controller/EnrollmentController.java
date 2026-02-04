package com.axonrh.learning.controller;

import com.axonrh.learning.entity.Enrollment;
import com.axonrh.learning.service.EnrollmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learning/enrollments")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    private UUID getTenantId(String tenantIdHeader) {
         if (tenantIdHeader != null && !tenantIdHeader.isEmpty()) {
             return UUID.fromString(tenantIdHeader);
         }
         return UUID.fromString("00000000-0000-0000-0000-000000000000");
    }

    @PostMapping
    public ResponseEntity<Enrollment> enroll(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @RequestBody Map<String, Object> body) {
        UUID courseId = UUID.fromString((String) body.get("courseId"));
        UUID employeeId = UUID.fromString((String) body.get("employeeId"));
        String employeeName = (String) body.get("employeeName");
        String dueDateStr = (String) body.get("dueDate");
        LocalDate dueDate = (dueDateStr != null && !dueDateStr.trim().isEmpty()) ? LocalDate.parse(dueDateStr) : null;
        
        return ResponseEntity.ok(enrollmentService.enroll(getTenantId(tenantIdHeader), courseId, employeeId, employeeName, dueDate));
    }

    @GetMapping
    public ResponseEntity<Page<Enrollment>> listAll(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, Pageable pageable) {
        return ResponseEntity.ok(enrollmentService.listAll(getTenantId(tenantIdHeader), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Enrollment> get(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        return ResponseEntity.ok(enrollmentService.get(getTenantId(tenantIdHeader), id));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Enrollment>> getByEmployee(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID employeeId) {
        return ResponseEntity.ok(enrollmentService.getByEmployee(getTenantId(tenantIdHeader), employeeId));
    }

    @GetMapping("/employee/{employeeId}/active")
    public ResponseEntity<List<Enrollment>> getActiveByEmployee(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID employeeId) {
        return ResponseEntity.ok(enrollmentService.getActiveByEmployee(getTenantId(tenantIdHeader), employeeId));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Page<Enrollment>> getByCourse(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID courseId, Pageable pageable) {
        return ResponseEntity.ok(enrollmentService.getByCourse(getTenantId(tenantIdHeader), courseId, pageable));
    }
    
    @GetMapping("/overdue")
    public ResponseEntity<List<Enrollment>> getOverdue(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        return ResponseEntity.ok(enrollmentService.getOverdue(getTenantId(tenantIdHeader)));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<Enrollment> start(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        return ResponseEntity.ok(enrollmentService.startCourse(getTenantId(tenantIdHeader), id));
    }

    @PostMapping("/{id}/lessons/{lessonId}/progress")
    public ResponseEntity<Enrollment> updateProgress(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
                                                     @PathVariable UUID id,
                                                     @PathVariable UUID lessonId,
                                                     @RequestBody Map<String, Object> body) {
        String status = (String) body.get("status");
        Integer timeSpent = body.get("timeSpent") != null ? ((Number) body.get("timeSpent")).intValue() : null;
        Integer videoPosition = body.get("videoPosition") != null ? ((Number) body.get("videoPosition")).intValue() : null;
        
        return ResponseEntity.ok(enrollmentService.updateLessonProgress(getTenantId(tenantIdHeader), id, lessonId, status, timeSpent, videoPosition));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Enrollment> complete(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        BigDecimal score = body.get("score") != null ? new BigDecimal(body.get("score").toString()) : BigDecimal.ZERO;
        return ResponseEntity.ok(enrollmentService.completeCourse(getTenantId(tenantIdHeader), id, score));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Enrollment> cancel(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(enrollmentService.cancel(getTenantId(tenantIdHeader), id, body.get("reason")));
    }
    
    @PostMapping("/{id}/approve")
    public ResponseEntity<Enrollment> approve(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @RequestParam UUID approverId) {
        return ResponseEntity.ok(enrollmentService.approve(getTenantId(tenantIdHeader), id, approverId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        enrollmentService.delete(getTenantId(tenantIdHeader), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/employee/{employeeId}/statistics")
    public ResponseEntity<EnrollmentService.EnrollmentStatistics> getEmployeeStatistics(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID employeeId) {
        return ResponseEntity.ok(enrollmentService.getEmployeeStatistics(getTenantId(tenantIdHeader), employeeId));
    }
}
