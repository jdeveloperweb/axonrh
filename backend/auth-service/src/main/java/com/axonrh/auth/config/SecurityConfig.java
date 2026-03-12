package com.axonrh.auth.config;

import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.qr.QrDataFactory;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.client.RestTemplate;
import com.axonrh.auth.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;

/**
 * Configuracao de seguranca do Spring Security.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableAsync
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Endpoints publicos
                        .requestMatchers(
                                "/api/v1/auth/login",
                                "/api/v1/auth/refresh",
                                "/api/v1/auth/forgot-password",
                                "/api/v1/auth/reset-password",
                                "/api/v1/auth/mfa/complete-mandatory-setup",
                                "/api/v1/auth/mfa/resend-setup-email",
                                "/api/v1/audit/log",
                                "/actuator/health",
                                "/actuator/info",
                                "/actuator/prometheus",
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        // Todos os outros requerem autenticacao
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Password encoder usando Argon2id (recomendado para 2024+).
     * Parametros seguros conforme OWASP.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new Argon2PasswordEncoder(
                16,     // salt length
                32,     // hash length
                1,      // parallelism
                65536,  // memory (64MB)
                3       // iterations
        );
    }

    /**
     * Verificador de codigos TOTP para 2FA.
     */
    @Bean
    public CodeVerifier totpCodeVerifier() {
        return new DefaultCodeVerifier(new DefaultCodeGenerator(), new SystemTimeProvider());
    }

    @Bean
    public SecretGenerator secretGenerator() {
        return new DefaultSecretGenerator();
    }

    @Bean
    public QrDataFactory qrDataFactory() {
        return new QrDataFactory(HashingAlgorithm.SHA1, 6, 30);
    }

    @Bean
    public ZxingPngQrGenerator qrGenerator() {
        return new ZxingPngQrGenerator();
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
