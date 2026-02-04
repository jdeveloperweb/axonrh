package com.axonrh.employee.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WellbeingAnalysisRequest {
    private String text;
    private Integer score;
}
