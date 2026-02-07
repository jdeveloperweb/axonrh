package com.axonrh.learning.controller;

import com.axonrh.learning.entity.CertificateConfig;
import com.axonrh.learning.service.CertificateConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learning/certificate-configs")
public class CertificateConfigController {

    private final CertificateConfigService service;

    public CertificateConfigController(CertificateConfigService service) {
        this.service = service;
    }

    private UUID getTenantId(String tenantIdHeader) {
        if (tenantIdHeader != null && !tenantIdHeader.isEmpty()) {
            return UUID.fromString(tenantIdHeader);
        }
        return UUID.fromString("00000000-0000-0000-0000-000000000000");
    }

    @GetMapping
    public ResponseEntity<CertificateConfig> getConfig(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestParam(required = false) UUID courseId) {
        UUID tenantId = getTenantId(tenantIdHeader);
        if (courseId != null) {
            return ResponseEntity.ok(service.getConfig(tenantId, courseId));
        }
        return ResponseEntity.ok(service.getGlobalConfig(tenantId));
    }

    @PostMapping
    public ResponseEntity<CertificateConfig> saveConfig(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestBody CertificateConfig config) {
        config.setTenantId(getTenantId(tenantIdHeader));
        return ResponseEntity.ok(service.saveConfig(config));
    }
}
