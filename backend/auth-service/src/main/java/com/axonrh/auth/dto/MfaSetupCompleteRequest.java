package com.axonrh.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MfaSetupCompleteRequest {

    @NotBlank(message = "Token de configuração é obrigatório")
    private String setupToken;

    @NotBlank(message = "Código TOTP é obrigatório")
    @Size(min = 6, max = 6, message = "Código deve ter exatamente 6 dígitos")
    @Pattern(regexp = "\\d{6}", message = "Código deve conter apenas dígitos")
    private String code;
}
