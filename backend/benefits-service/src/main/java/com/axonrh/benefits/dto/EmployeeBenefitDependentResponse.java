package com.axonrh.benefits.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeBenefitDependentResponse {
    private UUID id;
    private UUID dependentId;
    private String dependentName;
}
