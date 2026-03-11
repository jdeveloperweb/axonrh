package com.axonrh.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MfaEnableRequest {
    @NotBlank(message = "O segredo é obrigatório")
    private String secret;
    
    @NotBlank(message = "O código é obrigatório")
    private String code;
}
