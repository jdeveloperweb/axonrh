package com.axonrh.employee.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO para assinatura eletronica do contrato.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalHiringSignatureRequest {

    private boolean acceptedTerms;

    @NotBlank(message = "Texto da assinatura e obrigatorio")
    private String signatureText;

    private boolean acceptedConfidentiality;

    private boolean acceptedInternalPolicy;

    private String ipAddress;

    private String userAgent;
}
