package com.axonrh.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuracao de CORS para o API Gateway
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();

        // Origins permitidas
        corsConfig.setAllowedOriginPatterns(Arrays.asList(
                "https://*.axonrh.com.br",
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));

        // Metodos permitidos
        corsConfig.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"
        ));

        // Headers permitidos
        corsConfig.setAllowedHeaders(List.of("*"));

        // Headers expostos na resposta
        corsConfig.setExposedHeaders(Arrays.asList(
                "X-Request-Id",
                "X-Tenant-Id",
                "X-Correlation-Id",
                "Content-Disposition"
        ));

        // Permitir credentials (cookies, authorization headers)
        corsConfig.setAllowCredentials(true);

        // Cache do preflight (OPTIONS) por 1 hora
        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}
