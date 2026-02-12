package com.axonrh.vacation.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class EmployeeDTO {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String email;
    private java.time.LocalDate hireDate;
    private EmployeeDTO manager;
    private UUID tenantId;
}

