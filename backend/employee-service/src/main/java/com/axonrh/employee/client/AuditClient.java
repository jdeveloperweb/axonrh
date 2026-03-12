package com.axonrh.employee.client;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditClient {

    private final RestTemplate restTemplate;

    @Value("${axonrh.auth.url:http://auth-service:8081}")
    private String authServiceUrl;

    public void log(AuditRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<AuditRequest> entity = new HttpEntity<>(request, headers);
            restTemplate.postForEntity(authServiceUrl + "/api/v1/audit/log", entity, Void.class);
        } catch (Exception e) {
            log.error("Failed to send audit log: {}", e.getMessage());
        }
    }

    @Data
    @Builder
    public static class AuditRequest {
        private UUID tenantId;
        private UUID userId;
        private String userName;
        private String userEmail;
        private String action;
        private String resource;
        private String resourceId;
        private String ipAddress;
        private String details;
        private String status;
    }
}
