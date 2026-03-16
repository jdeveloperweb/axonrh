package com.axonrh.core.setup.controller;

import com.axonrh.core.setup.entity.PrivacyPolicy;
import com.axonrh.core.setup.service.PrivacyPolicyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/privacy")
public class PrivacyPolicyController {

    private final PrivacyPolicyService service;

    public PrivacyPolicyController(PrivacyPolicyService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<PrivacyPolicy> getPrivacyPolicy(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        return service.getByTenantId(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<PrivacyPolicy> savePrivacyPolicy(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody Map<String, String> body) {
        String content = body.get("content");
        if (content == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.save(tenantId, content, userId));
    }
}
