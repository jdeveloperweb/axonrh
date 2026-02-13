package com.axonrh.benefits.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDetailsDto {
    private UUID id;
    private String fullName;
    private LocalDate birthDate;
    private List<DependentDto> dependents;
}
