package com.axonrh.vacation.client;

import com.axonrh.vacation.dto.MedicalCertificateAnalysisRequest;
import com.axonrh.vacation.dto.MedicalCertificateAnalysisResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "ai-assistant-service", url = "${application.clients.ai-assistant-service:http://axonrh-ai-assistant-service:8088}")
public interface AiAssistantClient {

    @PostMapping("/api/v1/ai/medical/analyze")
    MedicalCertificateAnalysisResponse analyzeCertificate(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody MedicalCertificateAnalysisRequest request
    );
}
