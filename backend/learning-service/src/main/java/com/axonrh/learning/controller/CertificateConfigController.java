package com.axonrh.learning.controller;

import com.axonrh.learning.entity.CertificateConfig;
import com.axonrh.learning.service.CertificateConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/learning/certificate-configs")
public class CertificateConfigController {

    private final CertificateConfigService service;

    public CertificateConfigController(CertificateConfigService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<CertificateConfig> getConfig(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(required = false) UUID courseId) {
        if (courseId != null) {
            return ResponseEntity.ok(service.getConfig(tenantId, courseId));
        }
        return ResponseEntity.ok(service.getGlobalConfig(tenantId));
    }

    @PostMapping
    public ResponseEntity<CertificateConfig> saveConfig(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody CertificateConfig config) {
        config.setTenantId(tenantId);
        return ResponseEntity.ok(service.saveConfig(config));
    }
}
