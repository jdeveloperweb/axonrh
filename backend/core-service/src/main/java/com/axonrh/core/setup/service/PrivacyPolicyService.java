package com.axonrh.core.setup.service;

import com.axonrh.core.setup.entity.PrivacyPolicy;
import com.axonrh.core.setup.repository.PrivacyPolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PrivacyPolicyService {

    private final PrivacyPolicyRepository repository;

    public PrivacyPolicyService(PrivacyPolicyRepository repository) {
        this.repository = repository;
    }

    public Optional<PrivacyPolicy> getByTenantId(UUID tenantId) {
        return repository.findByTenantId(tenantId);
    }

    public PrivacyPolicy save(UUID tenantId, String content, UUID userId) {
        PrivacyPolicy policy = repository.findByTenantId(tenantId)
                .orElse(new PrivacyPolicy());
        
        if (policy.getId() == null) {
            policy.setTenantId(tenantId);
            policy.setCreatedBy(userId);
            policy.setContent(content);
        } else {
            policy.setContent(content);
            policy.setVersion(policy.getVersion() + 1);
            policy.setUpdatedBy(userId);
        }
        
        return repository.save(policy);
    }
}
