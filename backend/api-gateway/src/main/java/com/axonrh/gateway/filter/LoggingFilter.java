package com.axonrh.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Filtro global de logging para todas as requisicoes.
 * Registra informacoes de entrada e saida de cada request.
 */
@Slf4j
@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    private static final String REQUEST_ID_HEADER = "X-Request-Id";
    private static final String START_TIME_ATTRIBUTE = "requestStartTime";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // Gera ou usa Request ID existente
        String requestId = request.getHeaders().getFirst(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        // Marca o inicio da requisicao
        long startTime = Instant.now().toEpochMilli();
        exchange.getAttributes().put(START_TIME_ATTRIBUTE, startTime);

        // Extrai informacoes do request
        String method = request.getMethod().name();
        String path = request.getPath().value();
        String query = request.getURI().getQuery();
        String clientIp = getClientIp(request);
        String userAgent = request.getHeaders().getFirst("User-Agent");
        String tenantId = request.getHeaders().getFirst("X-Tenant-Id");

        // Log de entrada
        log.info(">>> Request: {} {} | RequestId: {} | Tenant: {} | IP: {} | UserAgent: {}",
                method,
                path + (query != null ? "?" + query : ""),
                requestId,
                tenantId != null ? tenantId : "unknown",
                clientIp,
                userAgent != null ? userAgent.substring(0, Math.min(50, userAgent.length())) : "unknown"
        );

        // Adiciona headers ao request
        String finalRequestId = requestId;
        ServerHttpRequest modifiedRequest = request.mutate()
                .header(REQUEST_ID_HEADER, requestId)
                .build();

        return chain.filter(exchange.mutate().request(modifiedRequest).build())
                .then(Mono.fromRunnable(() -> {
                    // Log de saida
                    ServerHttpResponse response = exchange.getResponse();
                    Long startTimeAttr = exchange.getAttribute(START_TIME_ATTRIBUTE);
                    long duration = startTimeAttr != null ?
                            Instant.now().toEpochMilli() - startTimeAttr : 0;

                    int statusCode = response.getStatusCode() != null ?
                            response.getStatusCode().value() : 0;

                    // Adiciona Request ID na resposta
                    response.getHeaders().add(REQUEST_ID_HEADER, finalRequestId);

                    log.info("<<< Response: {} {} | Status: {} | Duration: {}ms | RequestId: {}",
                            method,
                            path,
                            statusCode,
                            duration,
                            finalRequestId
                    );

                    // Log de warning para respostas lentas (> 2s)
                    if (duration > 2000) {
                        log.warn("Slow request detected: {} {} took {}ms", method, path, duration);
                    }

                    // Log de erro para status 5xx
                    if (statusCode >= 500) {
                        log.error("Server error: {} {} returned {}", method, path, statusCode);
                    }
                }));
    }

    /**
     * Extrai o IP real do cliente considerando proxies
     */
    private String getClientIp(ServerHttpRequest request) {
        String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp;
        }

        var remoteAddress = request.getRemoteAddress();
        return remoteAddress != null ? remoteAddress.getAddress().getHostAddress() : "unknown";
    }

    @Override
    public int getOrder() {
        // Executa antes de outros filtros
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
