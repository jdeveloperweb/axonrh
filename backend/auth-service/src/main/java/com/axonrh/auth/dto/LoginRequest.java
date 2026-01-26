package com.axonrh.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para requisicao de login.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Email e obrigatorio")
    @Email(message = "Email invalido")
    private String email;

    @NotBlank(message = "Senha e obrigatoria")
    private String password;

    // Codigo TOTP para 2FA (opcional, obrigatorio se 2FA ativado)
    private String totpCode;

    // Subdomain do tenant (extraido do host ou enviado explicitamente)
    private String tenantSubdomain;
}
