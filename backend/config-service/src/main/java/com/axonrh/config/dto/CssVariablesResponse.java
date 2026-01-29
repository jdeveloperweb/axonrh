package com.axonrh.config.dto;

import lombok.*;

import java.io.Serializable;
import java.util.Map;

/**
 * DTO de resposta com variaveis CSS geradas.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CssVariablesResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private String cssContent;
    private Map<String, String> lightTheme;
    private Map<String, String> darkTheme;
    private Map<String, String> highContrastTheme;
    private Integer version;
    private String cacheKey;
}
