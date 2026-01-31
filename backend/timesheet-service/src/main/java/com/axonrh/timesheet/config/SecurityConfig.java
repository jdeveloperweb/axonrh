package com.axonrh.timesheet.config;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.spec.SecretKeySpec;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.secret-key}")
    private String secretKey;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/api/v1/timesheet/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(), "HmacSHA256");
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
            
            // Tenta extrair authorities padrao (scope/scp)
            org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter defaultConverter = 
                new org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter();
            authorities.addAll(defaultConverter.convert(jwt));

            // Tenta extrair permissions do campo 'permissions' (padrao AxonRH)
            if (jwt.hasClaim("permissions")) {
                @SuppressWarnings("unchecked")
                java.util.List<String> perms = jwt.getClaimAsStringList("permissions");
                if (perms != null) {
                    perms.forEach(perm -> authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(perm)));
                }
            }

            return authorities;
        }
    }
}
