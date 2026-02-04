package com.axonrh.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WellbeingAnalysisResponse {
    private String sentiment; // POSITIVE, NEGATIVE, NEUTRAL
    private String riskLevel; // LOW, MEDIUM, HIGH
    private String keywords; // Comma separated
}
