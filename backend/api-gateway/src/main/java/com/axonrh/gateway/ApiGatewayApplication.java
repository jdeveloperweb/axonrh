package com.axonrh.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * AxonRH API Gateway
 *
 * Ponto de entrada principal para todas as requisicoes do sistema.
 * Responsabilidades:
 * - Roteamento para microservicos
 * - Rate limiting por tenant
 * - Validacao de JWT
 * - CORS policies
 * - Logging de requests/responses
 * - Circuit breaker
 */
@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
