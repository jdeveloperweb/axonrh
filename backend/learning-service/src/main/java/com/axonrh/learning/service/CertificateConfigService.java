package com.axonrh.learning.service;

import com.axonrh.learning.entity.CertificateConfig;
import com.axonrh.learning.repository.CertificateConfigRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class CertificateConfigService {

    private final CertificateConfigRepository repository;

    public CertificateConfigService(CertificateConfigRepository repository) {
        this.repository = repository;
    }

    public CertificateConfig getConfig(UUID tenantId, UUID courseId) {
        // Tenta buscar a configuração específica do curso
        return repository.findByTenantIdAndCourseId(tenantId, courseId)
                .orElseGet(() -> repository.findFirstByTenantIdAndCourseIdIsNull(tenantId)
                        .orElse(new CertificateConfig())); // Retorna vazio se não houver nenhuma
    }

    public CertificateConfig getGlobalConfig(UUID tenantId) {
        return repository.findFirstByTenantIdAndCourseIdIsNull(tenantId)
                .orElseGet(() -> {
                    CertificateConfig config = new CertificateConfig();
                    config.setTenantId(tenantId);
                    return config;
                });
    }

    public CertificateConfig saveConfig(CertificateConfig config) {
        return repository.save(config);
    }
    
    public void deleteConfig(UUID id) {
        repository.deleteById(id);
    }
}
