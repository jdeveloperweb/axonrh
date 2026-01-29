package com.axonrh.employee.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import java.nio.charset.StandardCharsets;

import javax.crypto.spec.SecretKeySpec;

/**
 * Configuracao de seguranca para o Employee Service.
 * Atua como Resource Server validando tokens JWT.
 */
@Configuration
@EnableWebSecurity
// @EnableMethodSecurity
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.secret-key}")
    private String secretKey;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Endpoints publicos e infra
                        .requestMatchers(
                                "/actuator/**",
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api/v1/**" // [DEBUG] Temporarily permit all API requests
                        ).permitAll()
                        .anyRequest().permitAll() // [DEBUG] Temporarily permit all
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            System.err.println(">>> [DEBUG-SECURITY] Authentication Entry Point hit!");
                            System.err.println(">>> [DEBUG-SECURITY] Error: " + authException.getMessage());
                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, authException.getMessage());
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            System.err.println(">>> [DEBUG-SECURITY] Access Denied Handler hit!");
                            System.err.println(">>> [DEBUG-SECURITY] Error: " + accessDeniedException.getMessage());
                            response.sendError(HttpServletResponse.SC_FORBIDDEN, accessDeniedException.getMessage());
                        })
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));

        return http.build();
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
                .requestMatchers("/api/v1/**")
                .requestMatchers("/actuator/**", "/api-docs/**", "/swagger-ui/**", "/swagger-ui.html");
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(secretKeySpec)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    public org.springframework.core.convert.converter.Converter<org.springframework.security.oauth2.jwt.Jwt, org.springframework.security.authentication.AbstractAuthenticationToken> jwtAuthenticationConverter() {
        org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter converter = new org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new JwtGrantedAuthoritiesConverter());
        return converter;
    }

    private static class JwtGrantedAuthoritiesConverter implements org.springframework.core.convert.converter.Converter<org.springframework.security.oauth2.jwt.Jwt, java.util.Collection<org.springframework.security.core.GrantedAuthority>> {
        @Override
        public java.util.Collection<org.springframework.security.core.GrantedAuthority> convert(org.springframework.security.oauth2.jwt.Jwt jwt) {
            java.util.Collection<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
            
            System.err.println(">>> [DEBUG-Security] Processing JWT for user: " + jwt.getSubject());
            System.err.println(">>> [DEBUG-Security] Claims keys: " + jwt.getClaims().keySet());

            // Tenta extrair authorities padrao (scope/scp)
            org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter defaultConverter = 
                new org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter();
            authorities.addAll(defaultConverter.convert(jwt));

            // Tenta extrair roles do realm_access (Padrao Keycloak)
            java.util.Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                @SuppressWarnings("unchecked")
                java.util.List<String> roles = (java.util.List<String>) realmAccess.get("roles");
                if (roles != null) {
                    roles.forEach(role -> authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(role)));
                }
            }

            // Tenta extrair roles do campo 'roles' direto
            if (jwt.hasClaim("roles")) {
                @SuppressWarnings("unchecked")
                java.util.List<String> roles = jwt.getClaimAsStringList("roles");
                if (roles != null) {
                    roles.forEach(role -> authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(role)));
                }
            }
            
             // Tenta extrair permissions do campo 'permissions' (padrao AxonRH)
            if (jwt.hasClaim("permissions")) {
                @SuppressWarnings("unchecked")
                java.util.List<String> perms = jwt.getClaimAsStringList("permissions");
                System.err.println(">>> [DEBUG-Security] Found permissions claim: " + perms);
                if (perms != null) {
                    perms.forEach(perm -> authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(perm)));
                }
            } else {
                System.err.println(">>> [DEBUG-Security] 'permissions' claim NOT found!");
            }

            System.err.println(">>> [DEBUG-Security] Final Authorities: " + authorities);
            return authorities;
        }
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOrigins(java.util.List.of("http://localhost:3000", "http://localhost:3001"));
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
        configuration.setAllowedHeaders(java.util.List.of("*"));
        configuration.setAllowCredentials(true);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
