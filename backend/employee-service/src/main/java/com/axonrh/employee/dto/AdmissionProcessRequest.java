package com.axonrh.employee.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO para criar processo de admissao.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdmissionProcessRequest {

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

    @Future(message = "Data de admissao deve ser futura")
    private LocalDate expectedHireDate;

    private UUID departmentId;

    private UUID positionId;

    /**
     * Dias de validade do link (padrao: 7).
     */
    @Min(1)
    @Max(30)
    private Integer linkValidityDays;

    private String notes;
}
