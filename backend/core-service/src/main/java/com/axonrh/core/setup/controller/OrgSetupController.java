package com.axonrh.core.setup.controller;

import com.axonrh.core.setup.entity.Department;
import com.axonrh.core.setup.entity.Position;
import com.axonrh.core.setup.service.SetupWizardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/setup/org")
public class OrgSetupController {

    private final SetupWizardService setupService;

    public OrgSetupController(SetupWizardService setupService) {
        this.setupService = setupService;
    }

    // Departments
    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getDepartments(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(setupService.getDepartments(tenantId));
    }

    @PostMapping("/departments")
    public ResponseEntity<Department> saveDepartment(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody Department department) {
        return ResponseEntity.ok(setupService.saveDepartment(tenantId, department));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Void> deleteDepartment(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id) {
        setupService.deleteDepartment(tenantId, id);
        return ResponseEntity.noContent().build();
    }

    // Positions
    @GetMapping("/positions")
    public ResponseEntity<List<Position>> getPositions(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(setupService.getPositions(tenantId));
    }

    @PostMapping("/positions")
    public ResponseEntity<Position> savePosition(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody Position position) {
        return ResponseEntity.ok(setupService.savePosition(tenantId, position));
    }

    @DeleteMapping("/positions/{id}")
    public ResponseEntity<Void> deletePosition(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id) {
        setupService.deletePosition(tenantId, id);
        return ResponseEntity.noContent().build();
    }
}
