package com.axonrh.timesheet.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class EmployeeDTO implements Serializable {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String email;
    private EmployeeSummaryDTO manager;
    private DepartmentDTO department;
    private UUID workScheduleId;
    private String workRegime;
    private String registrationNumber;
    private String cpf;
    private java.time.LocalDate hireDate;
    private String pisPasep;
}
