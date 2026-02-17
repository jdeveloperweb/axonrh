package com.axonrh.learning.controller;

import com.axonrh.learning.entity.Course;
import com.axonrh.learning.entity.CourseModule;
import com.axonrh.learning.entity.Lesson;
import com.axonrh.learning.service.CourseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learning/courses")
public class CourseController {

    private final CourseService courseService;
    private final com.axonrh.learning.service.LearningFileStorageService storageService;

    public CourseController(CourseService courseService, com.axonrh.learning.service.LearningFileStorageService storageService) {
        this.courseService = courseService;
        this.storageService = storageService;
    }

    private UUID getTenantId() {
        // TODO: Extract from security context or header. For now using a fixed ID or parameter
        // In a real scenario this would come from the authenticated user's token/context
        return UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder or extract from header
    }
    
    // Helper to get tenant form header if available, else placeholder
    private UUID getTenantId(String tenantIdHeader) {
         if (tenantIdHeader != null && !tenantIdHeader.isEmpty()) {
             return UUID.fromString(tenantIdHeader);
         }
         return UUID.fromString("00000000-0000-0000-0000-000000000000");
    }

    @PostMapping
    public ResponseEntity<Course> create(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @RequestBody Course course) {
        return ResponseEntity.ok(courseService.create(getTenantId(tenantIdHeader), course));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> get(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        return ResponseEntity.ok(courseService.get(getTenantId(tenantIdHeader), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Course> update(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @RequestBody Course course) {
        return ResponseEntity.ok(courseService.update(getTenantId(tenantIdHeader), id, course));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        courseService.delete(getTenantId(tenantIdHeader), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<Course>> list(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, Pageable pageable) {
        return ResponseEntity.ok(courseService.list(getTenantId(tenantIdHeader), pageable));
    }

    @GetMapping("/published")
    public ResponseEntity<List<Course>> listPublished(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        return ResponseEntity.ok(courseService.listPublished(getTenantId(tenantIdHeader)));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Course>> listByCategory(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID categoryId) {
        return ResponseEntity.ok(courseService.listByCategory(getTenantId(tenantIdHeader), categoryId));
    }

    @GetMapping("/mandatory")
    public ResponseEntity<List<Course>> listMandatory(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        return ResponseEntity.ok(courseService.listMandatory(getTenantId(tenantIdHeader)));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Course>> search(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @RequestParam String q, Pageable pageable) {
        return ResponseEntity.ok(courseService.search(getTenantId(tenantIdHeader), q, pageable));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<Course> publish(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        return ResponseEntity.ok(courseService.publish(getTenantId(tenantIdHeader), id));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<Course> archive(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        return ResponseEntity.ok(courseService.archive(getTenantId(tenantIdHeader), id));
    }

    @GetMapping("/{id}/statistics")
    public ResponseEntity<CourseService.CourseStatistics> getStatistics(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        return ResponseEntity.ok(courseService.getStatistics(getTenantId(tenantIdHeader), id));
    }

    // Modules
    @PostMapping("/{id}/modules")
    public ResponseEntity<Course> addModule(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @RequestBody CourseModule module) {
        return ResponseEntity.ok(courseService.addModule(getTenantId(tenantIdHeader), id, module));
    }

    @PutMapping("/{id}/modules/{moduleId}")
    public ResponseEntity<Course> updateModule(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @PathVariable UUID moduleId, @RequestBody CourseModule module) {
        return ResponseEntity.ok(courseService.updateModule(getTenantId(tenantIdHeader), id, moduleId, module));
    }

    @DeleteMapping("/{id}/modules/{moduleId}")
    public ResponseEntity<Course> removeModule(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @PathVariable UUID moduleId) {
        return ResponseEntity.ok(courseService.removeModule(getTenantId(tenantIdHeader), id, moduleId));
    }

    // Lessons
    @PostMapping("/{id}/modules/{moduleId}/lessons")
    public ResponseEntity<Course> addLesson(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @PathVariable UUID moduleId, @RequestBody Lesson lesson) {
        return ResponseEntity.ok(courseService.addLesson(getTenantId(tenantIdHeader), id, moduleId, lesson));
    }

    @DeleteMapping("/{id}/modules/{moduleId}/lessons/{lessonId}")
    public ResponseEntity<Course> removeLesson(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @PathVariable UUID moduleId, @PathVariable UUID lessonId) {
        return ResponseEntity.ok(courseService.removeLesson(getTenantId(tenantIdHeader), id, moduleId, lessonId));
    }

    // Thumbnails
    @PostMapping("/{id}/thumbnail")
    public ResponseEntity<Course> uploadThumbnail(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String thumbnailUrl = storageService.storeCourseThumbnail(file, id);
        Course updates = new Course();
        updates.setThumbnailUrl(thumbnailUrl);
        return ResponseEntity.ok(courseService.update(getTenantId(tenantIdHeader), id, updates));
    }

    @GetMapping("/thumbnails/{filename:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> getThumbnail(@PathVariable String filename) {
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get("uploads/learning-thumbnails").resolve(filename).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                String contentType = "image/jpeg";
                if (filename.toLowerCase().endsWith(".png")) contentType = "image/png";
                else if (filename.toLowerCase().endsWith(".gif")) contentType = "image/gif";
                else if (filename.toLowerCase().endsWith(".webp")) contentType = "image/webp";

                return ResponseEntity.ok()
                        .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (java.io.IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
