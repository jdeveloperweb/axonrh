package com.axonrh.employee.dto;

import com.axonrh.employee.entity.enums.DependentRelationship;
import com.axonrh.employee.entity.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDependentRequest {

    @NotBlank(message = "Nome completo e obrigatorio")
    private String name;

    @NotNull(message = "Parentesco e obrigatorio")
    private DependentRelationship relationship;

    @NotNull(message = "Data de nascimento e obrigatoria")
    @Past(message = "Data de nascimento deve ser no passado")
    private LocalDate birthDate;

    @Pattern(regexp = "\\d{11}", message = "CPF deve conter 11 digitos")
    private String cpf;

    private Gender gender;
    @JsonProperty("isIRDependent")
    private Boolean isIRDependent;

    @JsonProperty("isHealthPlanDependent")
    private Boolean isHealthPlanDependent;

    @JsonProperty("isAllowanceDependent")
    private Boolean isAllowanceDependent;
    private String birthCertificateNumber;
    private LocalDate startDate;
    private LocalDate endDate;
}
