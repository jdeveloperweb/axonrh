package com.axonrh.integration.dynamic.controller;

import com.axonrh.integration.dynamic.entity.IntegrationConfig;
import com.axonrh.integration.dynamic.entity.IntegrationLog;
import com.axonrh.integration.dynamic.repository.IntegrationConfigRepository;
import com.axonrh.integration.dynamic.service.DynamicIntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/integrations")
public class IntegrationConfigController {

    private final IntegrationConfigRepository configRepository;
    private final DynamicIntegrationService dynamicIntegrationService;

    public IntegrationConfigController(IntegrationConfigRepository configRepository,
                                       DynamicIntegrationService dynamicIntegrationService) {
        this.configRepository = configRepository;
        this.dynamicIntegrationService = dynamicIntegrationService;
    }

    @GetMapping
    public List<IntegrationConfig> listConfigs() {
        return configRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<IntegrationConfig> getConfig(@PathVariable UUID id) {
        return configRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/configs")
    public IntegrationConfig createConfig(@RequestBody IntegrationConfig config) {
        return configRepository.save(config);
    }

    @PutMapping("/configs/{id}")
    public ResponseEntity<IntegrationConfig> updateConfig(@PathVariable UUID id, @RequestBody IntegrationConfig configDetails) {
        return configRepository.findById(id)
                .map(config -> {
                    config.setName(configDetails.getName());
                    config.setDescription(configDetails.getDescription());
                    config.setTargetUrl(configDetails.getTargetUrl());
                    config.setHttpMethod(configDetails.getHttpMethod());
                    config.setHeadersTemplate(configDetails.getHeadersTemplate());
                    config.setBodyTemplate(configDetails.getBodyTemplate());
                    config.setResponseMapping(configDetails.getResponseMapping());
                    config.setActive(configDetails.isActive());
                    config.setRetryCount(configDetails.getRetryCount());
                    config.setTimeoutSeconds(configDetails.getTimeoutSeconds());
                    return ResponseEntity.ok(configRepository.save(config));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/configs/{id}")
    public ResponseEntity<Void> deleteConfig(@PathVariable UUID id) {
        if (configRepository.existsById(id)) {
            configRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/execute/{configName}")
    public ResponseEntity<IntegrationLog> executeIntegration(@PathVariable String configName, @RequestBody Map<String, Object> data) {
        try {
            IntegrationLog log = dynamicIntegrationService.executeIntegration(configName, data);
            return ResponseEntity.ok(log);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build(); // Ou retornar mensagem de erro específica
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
