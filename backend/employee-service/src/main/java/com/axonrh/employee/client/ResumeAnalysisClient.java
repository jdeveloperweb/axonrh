package com.axonrh.employee.client;

import com.axonrh.employee.dto.ResumeAnalysisRequest;
import com.axonrh.employee.dto.ResumeAnalysisResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "ai-assistant-resume", url = "${application.services.ai-assistant.url:http://ai-assistant-service:8088}")
public interface ResumeAnalysisClient {

    @PostMapping("/api/v1/ai/resume/analyze")
    ResumeAnalysisResponse analyzeResume(@RequestBody ResumeAnalysisRequest request);
}
