package com.axonrh.core.setup.controller;

import com.axonrh.core.setup.entity.CompanyProfile;
import com.axonrh.core.setup.entity.SetupProgress;
import com.axonrh.core.setup.service.SetupWizardService;
import com.axonrh.core.setup.service.SetupWizardService.SetupSummary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/setup")
public class SetupWizardController {

    private static final Logger log = LoggerFactory.getLogger(SetupWizardController.class);
    private final SetupWizardService setupService;

    public SetupWizardController(SetupWizardService setupService) {
        this.setupService = setupService;
    }

    @GetMapping("/progress")
    public ResponseEntity<SetupProgress> getProgress(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId) {

        SetupProgress progress = setupService.getOrCreateProgress(tenantId, userId);
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/summary")
    public ResponseEntity<SetupSummary> getSummary(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {

        SetupSummary summary = setupService.getSummary(tenantId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/steps/{step}")
    public ResponseEntity<Map<String, Object>> getStepData(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable int step) {

        Map<String, Object> data = setupService.getStepData(tenantId, step);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/steps/{step}/save")
    public ResponseEntity<SetupProgress> saveStepData(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable int step,
            @RequestBody Map<String, Object> data) {

        log.info("Recebido save da etapa {} do setup para tenant {}", step, tenantId);
        SetupProgress progress = setupService.saveStepData(tenantId, step, data);
        return ResponseEntity.ok(progress);
    }

    @PostMapping("/steps/{step}/complete")
    public ResponseEntity<SetupProgress> completeStep(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable int step,
            @RequestBody(required = false) Map<String, Object> data) {

        log.info("Recebido complete da etapa {} do setup para tenant {}", step, tenantId);
        SetupProgress progress = setupService.completeStep(tenantId, step, data);
        return ResponseEntity.ok(progress);
    }

    @PostMapping("/steps/{step}/goto")
    public ResponseEntity<SetupProgress> goToStep(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable int step) {

        SetupProgress progress = setupService.goToStep(tenantId, step);
        return ResponseEntity.ok(progress);
    }

    @PostMapping("/finish")
    public ResponseEntity<SetupProgress> finishSetup(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {

        SetupProgress progress = setupService.finishSetup(tenantId);
        return ResponseEntity.ok(progress);
    }

    // Company Profile endpoints
    @GetMapping("/company")
    public ResponseEntity<CompanyProfile> getCompanyProfile(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {

        return setupService.getCompanyProfile(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/company")
    public ResponseEntity<CompanyProfile> saveCompanyProfile(
            @RequestHeader(value = "X-Tenant-ID", required = false) UUID headerTenantId,
            @RequestBody CompanyProfile profile) {

        UUID tenantId = headerTenantId;
        if (tenantId == null) {
            tenantId = profile.getTenantId();
        }

        // Se tenantId for nulo, o servico ira gerar um novo (inicio do setup)
        log.info("Recebido save do perfil da empresa. TenantID: {}", tenantId != null ? tenantId : "A SER GERADO");
        CompanyProfile saved = setupService.saveCompanyProfile(tenantId, profile);
        return ResponseEntity.ok(saved);
    }
}
