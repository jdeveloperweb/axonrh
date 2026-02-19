package com.axonrh.employee.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO para criar processo de contratacao digital.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalHiringRequest {

    @NotBlank(message = "Nome do candidato e obrigatorio")
    @Size(min = 3, max = 200)
    private String candidateName;

    @NotBlank(message = "Email do candidato e obrigatorio")
    @Email(message = "Email invalido")
    private String candidateEmail;

    @Pattern(regexp = "\\d{11}", message = "CPF deve conter 11 digitos")
    private String candidateCpf;

    @Pattern(regexp = "\\d{10,11}", message = "Telefone invalido")
    private String candidatePhone;

    private UUID candidateId;

    private UUID vacancyId;

    private UUID departmentId;

    private UUID positionId;

    private String employmentType;

    private BigDecimal baseSalary;

    private LocalDate expectedHireDate;

    @Min(1)
    @Max(30)
    private Integer linkValidityDays;

    private String notes;
}
