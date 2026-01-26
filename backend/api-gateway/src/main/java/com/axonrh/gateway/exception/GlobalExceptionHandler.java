package com.axonrh.gateway.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

/**
 * Handler global de excecoes para o API Gateway.
 * Formata erros em JSON padronizado.
 */
@Slf4j
@Component
@Order(-2) // Alta prioridade para capturar erros antes do handler padrao
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        HttpStatus status = determineHttpStatus(ex);
        String message = determineMessage(ex);
        String path = exchange.getRequest().getPath().value();
        String requestId = exchange.getRequest().getHeaders().getFirst("X-Request-Id");

        log.error("Error handling request {} {}: {} - {}",
                exchange.getRequest().getMethod(),
                path,
                status,
                ex.getMessage()
        );

        // Formato JSON padrao de erro
        String errorResponse = String.format("""
                {
                    "timestamp": "%s",
                    "status": %d,
                    "error": "%s",
                    "message": "%s",
                    "path": "%s",
                    "requestId": "%s"
                }
                """,
                Instant.now().toString(),
                status.value(),
                status.getReasonPhrase(),
                escapeJson(message),
                path,
                requestId != null ? requestId : "unknown"
        );

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        DataBuffer buffer = exchange.getResponse()
                .bufferFactory()
                .wrap(errorResponse.getBytes(StandardCharsets.UTF_8));

        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private HttpStatus determineHttpStatus(Throwable ex) {
        if (ex instanceof ResponseStatusException rse) {
            return HttpStatus.valueOf(rse.getStatusCode().value());
        }

        // Erros de conexao com servicos
        if (ex.getMessage() != null && ex.getMessage().contains("Connection refused")) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        }

        // Timeout
        if (ex.getMessage() != null && ex.getMessage().contains("timeout")) {
            return HttpStatus.GATEWAY_TIMEOUT;
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private String determineMessage(Throwable ex) {
        if (ex instanceof ResponseStatusException rse) {
            return rse.getReason() != null ? rse.getReason() : rse.getMessage();
        }

        // Mensagens amigaveis para erros comuns
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("Connection refused")) {
                return "Service temporarily unavailable. Please try again later.";
            }
            if (ex.getMessage().contains("timeout")) {
                return "Request timeout. The service is taking too long to respond.";
            }
        }

        return "An unexpected error occurred. Please try again later.";
    }

    /**
     * Escapa caracteres especiais para JSON
     */
    private String escapeJson(String text) {
        if (text == null) return "";
        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
