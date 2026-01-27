package com.axonrh.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * AxonRH Auth Service
 *
 * Servico responsavel por:
 * - Autenticacao de usuarios (email/senha, SSO)
 * - Geracao e validacao de tokens JWT
 * - Gestao de refresh tokens
 * - Autenticacao de dois fatores (2FA/TOTP)
 * - Controle de acesso baseado em papeis (RBAC)
 * - Gestao de usuarios, roles e permissoes
 * - Bloqueio de conta apos tentativas falhas
 */
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.axonrh")
@EnableJpaRepositories(basePackages = {"com.axonrh.auth.repository", "com.axonrh.kafka.dlq"})
@EntityScan(basePackages = {"com.axonrh.auth.entity", "com.axonrh.kafka.dlq"})
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
