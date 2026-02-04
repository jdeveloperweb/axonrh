package com.axonrh.ai.controller;

import com.axonrh.ai.dto.WellbeingCheckInRequest;
import com.axonrh.ai.entity.EmployeeWellbeing;
import com.axonrh.ai.service.WellbeingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/wellbeing")
@RequiredArgsConstructor
public class WellbeingController {

    private final WellbeingService wellbeingService;

    @PostMapping("/analyze")
    public ResponseEntity<com.axonrh.ai.dto.WellbeingAnalysisResponse> analyze(@RequestBody com.axonrh.ai.dto.WellbeingAnalysisRequest request) {
        return ResponseEntity.ok(wellbeingService.analyze(request));
    }
}
