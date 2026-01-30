package com.axonrh.vacation.dto;

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
public class VacationPeriodCreateDTO {
    private UUID employeeId;
    private String employeeName;
    private LocalDate admissionDate;
}
