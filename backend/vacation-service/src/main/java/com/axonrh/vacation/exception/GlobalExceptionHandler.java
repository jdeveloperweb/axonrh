package com.axonrh.vacation.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidOperationException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidOperation(InvalidOperationException ex) {
        log.warn("Operacao invalida: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", "Bad Request",
                "message", ex.getMessage(),
                "timestamp", Instant.now().toString()
        ));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        log.warn("Acesso negado: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "code", "FORBIDDEN",
                "message", "Você não tem permissão para realizar esta ação.",
                "timestamp", Instant.now().toString()
        ));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Recurso nao encontrado: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", "Not Found",
                "message", ex.getMessage(),
                "timestamp", Instant.now().toString()
        ));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        log.warn("Erro de validação: {}", ex.getMessage());
        java.util.Map<String, String> details = new java.util.HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e ->
                details.put(e.getField(), e.getDefaultMessage())
        );
        String summary = details.values().stream().findFirst().orElse("Erro de validação nos campos.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", "Validation Error",
                "message", summary,
                "details", details,
                "timestamp", Instant.now().toString()
        ));
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex) {
        log.warn("Erro ao processar JSON: {}", ex.getMessage());
        String message = "Erro ao processar os dados enviados. Verifique o formulário.";
        Throwable cause = ex.getCause();
        if (cause instanceof com.fasterxml.jackson.databind.exc.InvalidFormatException) {
            com.fasterxml.jackson.databind.exc.InvalidFormatException ife = (com.fasterxml.jackson.databind.exc.InvalidFormatException) cause;
            String fieldName = ife.getPath().isEmpty() ? "campo" : ife.getPath().get(ife.getPath().size()-1).getFieldName();
            if (ife.getTargetType() != null && ife.getTargetType().isEnum()) {
                message = String.format("O valor '%s' não é válido para o campo '%s'. Valores aceitos: %s",
                        ife.getValue(), fieldName, java.util.Arrays.toString(ife.getTargetType().getEnumConstants()));
            }
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", "Bad Request",
                "message", message,
                "timestamp", Instant.now().toString()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("Erro interno: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal Server Error",
                "message", "Ocorreu um erro ao processar a solicitação.",
                "timestamp", Instant.now().toString()
        ));
    }
}
