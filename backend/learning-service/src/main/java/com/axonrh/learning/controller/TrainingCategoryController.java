package com.axonrh.learning.controller;

import com.axonrh.learning.entity.TrainingCategory;
import com.axonrh.learning.service.TrainingCategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learning/categories")
public class TrainingCategoryController {

    private final TrainingCategoryService categoryService;

    public TrainingCategoryController(TrainingCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    private UUID getTenantId(String tenantIdHeader) {
         if (tenantIdHeader != null && !tenantIdHeader.isEmpty()) {
             return UUID.fromString(tenantIdHeader);
         }
         return UUID.fromString("00000000-0000-0000-0000-000000000000");
    }

    @PostMapping
    public ResponseEntity<TrainingCategory> create(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @RequestBody TrainingCategory category) {
        return ResponseEntity.ok(categoryService.create(getTenantId(tenantIdHeader), category));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainingCategory> update(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id, @RequestBody TrainingCategory category) {
        return ResponseEntity.ok(categoryService.update(getTenantId(tenantIdHeader), id, category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrainingCategory> get(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        return ResponseEntity.ok(categoryService.get(getTenantId(tenantIdHeader), id));
    }

    @GetMapping
    public ResponseEntity<List<TrainingCategory>> list(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        return ResponseEntity.ok(categoryService.list(getTenantId(tenantIdHeader)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        categoryService.delete(getTenantId(tenantIdHeader), id);
        return ResponseEntity.noContent().build();
    }
}
