package com.axonrh.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

/**
 * Configuracoes do API Gateway
 */
@Configuration
public class GatewayConfig {

    /**
     * Key resolver para rate limiting baseado no tenant.
     * Extrai o tenant do header X-Tenant-Id ou do subdomain.
     */
    @Bean
    public KeyResolver tenantKeyResolver() {
        return exchange -> {
            // Primeiro tenta pegar do header
            String tenantId = exchange.getRequest().getHeaders().getFirst("X-Tenant-Id");

            // Se nao tiver header, tenta extrair do subdomain
            if (tenantId == null || tenantId.isBlank()) {
                String host = exchange.getRequest().getHeaders().getFirst("Host");
                if (host != null && host.contains(".")) {
                    tenantId = host.split("\\.")[0];
                }
            }

            // Fallback para IP se nao conseguir identificar tenant
            if (tenantId == null || tenantId.isBlank()) {
                var remoteAddress = exchange.getRequest().getRemoteAddress();
                tenantId = remoteAddress != null ? remoteAddress.getAddress().getHostAddress() : "anonymous";
            }

            return Mono.just(tenantId);
        };
    }

    /**
     * Key resolver baseado no IP do cliente (fallback)
     */
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            var remoteAddress = exchange.getRequest().getRemoteAddress();
            String ip = remoteAddress != null ? remoteAddress.getAddress().getHostAddress() : "unknown";
            return Mono.just(ip);
        };
    }
}
