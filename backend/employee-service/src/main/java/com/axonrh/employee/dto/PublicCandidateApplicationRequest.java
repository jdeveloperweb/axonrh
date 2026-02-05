package com.axonrh.employee.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para candidatura pública (formulário externo)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicCandidateApplicationRequest {

    @NotBlank(message = "O nome é obrigatório")
    @Size(max = 200, message = "O nome deve ter no máximo 200 caracteres")
    @Schema(description = "Nome completo do candidato", example = "João Silva")
    private String fullName;

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email inválido")
    @Size(max = 200, message = "O email deve ter no máximo 200 caracteres")
    @Schema(description = "Email do candidato", example = "joao.silva@email.com")
    private String email;

    @Size(max = 20, message = "O telefone deve ter no máximo 20 caracteres")
    @Schema(description = "Telefone para contato", example = "(11) 98765-4321")
    private String phone;

    @Size(max = 100, message = "A cidade deve ter no máximo 100 caracteres")
    @Schema(description = "Cidade", example = "São Paulo")
    private String city;

    @Size(max = 2, message = "O estado deve ter 2 caracteres")
    @Schema(description = "Estado (UF)", example = "SP")
    private String state;

    @Size(max = 500, message = "O LinkedIn deve ter no máximo 500 caracteres")
    @Schema(description = "URL do perfil no LinkedIn")
    private String linkedinUrl;

    @Size(max = 500, message = "O portfólio deve ter no máximo 500 caracteres")
    @Schema(description = "URL do portfólio")
    private String portfolioUrl;
}
