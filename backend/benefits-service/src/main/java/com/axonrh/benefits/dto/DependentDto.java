package com.axonrh.benefits.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DependentDto {
    private UUID id;
    private String name;
    private String relationship;
    private LocalDate birthDate;
    private Boolean isHealthPlanDependent;
}
