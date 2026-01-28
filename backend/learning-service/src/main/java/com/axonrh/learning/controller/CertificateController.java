package com.axonrh.learning.controller;

import com.axonrh.learning.entity.Certificate;
import com.axonrh.learning.service.CertificateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/certificates")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    private UUID getTenantId(String tenantIdHeader) {
         if (tenantIdHeader != null && !tenantIdHeader.isEmpty()) {
             return UUID.fromString(tenantIdHeader);
         }
         return UUID.fromString("00000000-0000-0000-0000-000000000000");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Certificate> get(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID id) {
        return ResponseEntity.ok(certificateService.get(getTenantId(tenantIdHeader), id));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Certificate>> listByEmployee(@RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader, @PathVariable UUID employeeId) {
        return ResponseEntity.ok(certificateService.listByEmployee(getTenantId(tenantIdHeader), employeeId));
    }

    @GetMapping("/verify/{code}")
    public ResponseEntity<Certificate> verify(@PathVariable String code) {
        return ResponseEntity.ok(certificateService.verify(code));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Map<String, String>> download(@PathVariable UUID id) {
        // In a real implementation this would generate a PDF and return the URL or stream the file
        // For now returning a mock URL
        return ResponseEntity.ok(Map.of("url", "/documents/certificates/" + id + ".pdf"));
    }
}
