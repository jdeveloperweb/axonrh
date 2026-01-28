package com.axonrh.ai.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<Map<String, Object>> handleWebClientResponseException(WebClientResponseException ex) {
        log.error("WebClient error: {} - Body: {}", ex.getMessage(), ex.getResponseBodyAsString());

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", ex.getStatusCode().value());
        
        String message = "Erro na comunicação com serviço externo.";
        if (ex.getStatusCode().value() == 401) {
            message = "Erro de autenticação com o provedor de IA (API Key inválida ou expirada). Verifique as configurações.";
        } else if (ex.getStatusCode().value() == 429) {
            message = "Limite de requisições excedido no provedor de IA (Cota excedida).";
        }

        body.put("error", ex.getStatusText());
        body.put("message", message);
        
        // Truncate details if too long
        String details = ex.getResponseBodyAsString();
        if (details != null && details.length() > 500) {
            details = details.substring(0, 500) + "...";
        }
        body.put("details", details);

        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Internal Server Error");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
