package com.axonrh.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscInsightRequest {
    private UUID employeeId;
    private String employeeName;
    private Integer dScore;
    private Integer iScore;
    private Integer sScore;
    private Integer cScore;
    private String primaryProfile;
    private String secondaryProfile;
}
