package com.axonrh.core.setup.controller;

import com.axonrh.core.setup.entity.ImportJob;
import com.axonrh.core.setup.entity.ImportJob.ImportType;
import com.axonrh.core.setup.service.ImportService;
import com.axonrh.core.setup.service.ImportService.ImportTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/setup/import")
public class ImportController {

    private final ImportService importService;

    public ImportController(ImportService importService) {
        this.importService = importService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ImportJob> uploadFile(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestParam("type") ImportType type,
            @RequestParam("file") MultipartFile file) {

        ImportJob job = importService.createImportJob(tenantId, type, file, userId);
        return ResponseEntity.ok(job);
    }

    @PostMapping("/jobs/{jobId}/process")
    public ResponseEntity<Void> processImport(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID jobId) {

        importService.processImportAsync(jobId);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/jobs/{jobId}/rollback")
    public ResponseEntity<ImportJob> rollbackImport(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID jobId) {

        ImportJob job = importService.rollbackImport(tenantId, jobId);
        return ResponseEntity.ok(job);
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<ImportJob>> listJobs(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {

        List<ImportJob> jobs = importService.listJobs(tenantId);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<ImportJob> getJob(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID jobId) {

        return importService.getJob(tenantId, jobId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/templates/{type}")
    public ResponseEntity<ImportTemplate> getTemplate(@PathVariable ImportType type) {
        ImportTemplate template = importService.getTemplate(type);
        return ResponseEntity.ok(template);
    }

    @GetMapping("/types")
    public ResponseEntity<ImportType[]> getImportTypes() {
        return ResponseEntity.ok(ImportType.values());
    }
}
