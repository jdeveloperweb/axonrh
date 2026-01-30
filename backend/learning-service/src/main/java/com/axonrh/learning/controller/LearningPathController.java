package com.axonrh.learning.controller;

import com.axonrh.learning.entity.LearningPath;
import com.axonrh.learning.entity.PathEnrollment;
import com.axonrh.learning.service.LearningPathService;
import com.axonrh.learning.service.EnrollmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learning/paths")
public class LearningPathController {

    private final LearningPathService pathService;
    private final EnrollmentService enrollmentService;

    public LearningPathController(LearningPathService pathService, EnrollmentService enrollmentService) {
        this.pathService = pathService;
        this.enrollmentService = enrollmentService;
    }

    private UUID getTenantId(String tenantIdHeader) {
         if (tenantIdHeader != null && !tenantIdHeader.isEmpty()) {
             return UUID.fromString(tenantIdHeader);
         }
         return UUID.fromString("00000000-0000-0000-0000-000000000000");
    }

    @PostMapping
    public ResponseEntity<LearningPath> create(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @RequestBody LearningPath path) {
        return ResponseEntity.ok(pathService.create(getTenantId(tenantIdHeader), path));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningPath> get(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        return ResponseEntity.ok(pathService.get(getTenantId(tenantIdHeader), id));
    }

    @GetMapping
    public ResponseEntity<Page<LearningPath>> list(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, Pageable pageable) {
        return ResponseEntity.ok(pathService.list(getTenantId(tenantIdHeader), pageable));
    }

    @GetMapping("/published")
    public ResponseEntity<List<LearningPath>> listPublished(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        return ResponseEntity.ok(pathService.listPublished(getTenantId(tenantIdHeader)));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<LearningPath> publish(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        return ResponseEntity.ok(pathService.publish(getTenantId(tenantIdHeader), id));
    }

    @PostMapping("/{id}/enroll")
    public ResponseEntity<PathEnrollment> enroll(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        UUID employeeId = UUID.fromString((String) body.get("employeeId"));
        String employeeName = (String) body.get("employeeName");
        return ResponseEntity.ok(enrollmentService.enrollInPath(getTenantId(tenantIdHeader), id, employeeId, employeeName));
    }

    @GetMapping("/enrollments/employee/{employeeId}")
    public ResponseEntity<List<PathEnrollment>> getEnrollments(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID employeeId) {
        return ResponseEntity.ok(enrollmentService.getPathEnrollmentsByEmployee(getTenantId(tenantIdHeader), employeeId));
    }
}
