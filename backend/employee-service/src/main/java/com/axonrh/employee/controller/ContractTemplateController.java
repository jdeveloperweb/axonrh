package com.axonrh.employee.controller;

import com.axonrh.employee.entity.ContractTemplate;
import com.axonrh.employee.repository.ContractTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contract-templates")
@RequiredArgsConstructor
public class ContractTemplateController {

    private final ContractTemplateRepository repository;

    @GetMapping
    public List<ContractTemplate> list(@RequestHeader("X-Tenant-Id") UUID tenantId) {
        return repository.findByTenantIdAndIsActiveTrueOrderByName(tenantId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractTemplate> getById(@RequestHeader("X-Tenant-Id") UUID tenantId, @PathVariable UUID id) {
        return repository.findByTenantIdAndId(tenantId, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/default/{type}")
    public ResponseEntity<ContractTemplate> getDefault(@RequestHeader("X-Tenant-Id") UUID tenantId, @PathVariable String type) {
        return repository.findByTenantIdAndContractTypeAndIsDefaultTrue(tenantId, type.toUpperCase())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ContractTemplate save(@RequestHeader("X-Tenant-Id") UUID tenantId, @RequestBody ContractTemplate template) {
        template.setTenantId(tenantId);
        if (template.getIsDefault()) {
            // Se for default, desmarcar outros do mesmo tipo como default
            repository.findByTenantIdAndContractTypeAndIsDefaultTrue(tenantId, template.getContractType())
                    .ifPresent(old -> {
                        if (!old.getId().equals(template.getId())) {
                            old.setIsDefault(false);
                            repository.save(old);
                        }
                    });
        }
        return repository.save(template);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-Tenant-Id") UUID tenantId, @PathVariable UUID id) {
        repository.findByTenantIdAndId(tenantId, id).ifPresent(t -> {
            t.setIsActive(false);
            repository.save(t);
        });
        return ResponseEntity.noContent().build();
    }
}
