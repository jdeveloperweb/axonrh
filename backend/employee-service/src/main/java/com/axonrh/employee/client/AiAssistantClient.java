package com.axonrh.employee.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "ai-assistant-service", url = "${application.services.ai-assistant.url:http://ai-assistant-service:8088}")
public interface AiAssistantClient {

    @PostMapping("/api/v1/ai/wellbeing/analyze")
    WellbeingAnalysisResponse analyzeWellbeing(@RequestBody WellbeingAnalysisRequest request);
}
