package com.axonrh.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WellbeingStats {
    private int totalCheckins;
    private double averageScore;
    private Map<String, Long> sentimentDistribution;
    private long highRiskCount;
}
