package com.axonrh.employee.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WellbeingAnalysisResponse {
    private String sentiment;
    private String riskLevel;
    private String keywords;
}
