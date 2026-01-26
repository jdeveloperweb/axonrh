package com.axonrh.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * AxonRH Config Service
 *
 * Servico responsavel por:
 * - Gestao de configuracoes por tenant
 * - Identidade visual (white-label)
 * - Temas claro/escuro/alto contraste
 * - Configuracao de tela de login
 * - Versionamento de configuracoes
 * - Cache de configuracoes com Redis
 */
@SpringBootApplication
@EnableCaching
public class ConfigServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConfigServiceApplication.class, args);
    }
}
