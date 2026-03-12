package com.axonrh.auth.controller;

import com.axonrh.auth.entity.AuditLog;
import com.axonrh.auth.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @PostMapping("/log")
    public ResponseEntity<Void> log(@RequestBody AuditLog logEntry) {
        auditService.log(logEntry);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Page<AuditLog>> getLogs(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(auditService.getLogs(tenantId, pageable));
    }
}
