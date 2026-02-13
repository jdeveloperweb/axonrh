package com.axonrh.benefits.dto;

import com.axonrh.benefits.enums.BenefitCategory;
import com.axonrh.benefits.enums.CalculationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenefitTypeResponse {

    private UUID id;
    private String name;
    private String description;
    private BenefitCategory category;
    private CalculationType calculationType;
    private BigDecimal defaultValue;
    private BigDecimal defaultPercentage;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
