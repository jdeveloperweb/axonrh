package com.axonrh.employee.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionResponse {

    private UUID id;
    private String code;
    private String title;
    private String description;
    private String responsibilities;
    private String cboCode;
    private BigDecimal salaryRangeMin;
    private BigDecimal salaryRangeMax;
    private String level;
    private UUID departmentId;
    private String departmentName;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
