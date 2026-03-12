package com.axonrh.learning.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditClient {

    private final RestTemplate restTemplate;

    @Value("${axonrh.auth-service.url:http://auth-service:8081}")
    private String authServiceUrl;

    public void log(AuditRequest request) {
        try {
            restTemplate.postForEntity(authServiceUrl + "/api/v1/audit/log", request, Void.class);
        } catch (Exception e) {
            log.error("Failed to send audit log: {}", e.getMessage());
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditRequest {
        private UUID tenantId;
        private UUID userId;
        private String userName;
        private String userEmail;
        private String action;
        private String resource;
        private String resourceId;
        private String ipAddress;
        private String userAgent;
        private String details;
        private String status;
    }
}
