package com.axonrh.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EapRequestDTO {
    private UUID employeeId;
    private String employeeName;
    private Integer score;
    private String notes;
    private String riskLevel;
    private LocalDateTime createdAt;
}
