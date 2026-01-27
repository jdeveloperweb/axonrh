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
@SpringBootApplication(scanBasePackages = "com.axonrh")
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
