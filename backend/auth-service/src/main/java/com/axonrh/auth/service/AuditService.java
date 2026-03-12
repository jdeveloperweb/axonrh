package com.axonrh.auth.service;

import com.axonrh.auth.entity.AuditLog;
import com.axonrh.auth.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(AuditLog logEntry) {
        log.info("Audit Log: {} by {} on {}:{}", logEntry.getAction(), logEntry.getUserEmail(), logEntry.getResource(), logEntry.getResourceId());
        auditLogRepository.save(logEntry);
    }

    public Page<AuditLog> getLogs(UUID tenantId, Pageable pageable) {
        return auditLogRepository.findByTenantId(tenantId, pageable);
    }
}
