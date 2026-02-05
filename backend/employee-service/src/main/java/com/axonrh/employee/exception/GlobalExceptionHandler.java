package com.axonrh.employee.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex) {
        System.err.println(">>> [DEBUG-CRITICAL-SYS] ACCESS DENIED (System.err): " + ex.getMessage());
        log.error(">>> [DEBUG-CRITICAL] ACCESS DENIED: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Access Denied");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException ex) {
        log.error(">>> [DEBUG-CRITICAL] VALIDATION FAILED: {}", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Object> handleMissingHeader(MissingRequestHeaderException ex) {
        log.error(">>> [DEBUG-CRITICAL] MISSING HEADER: {}", ex.getHeaderName());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Missing Header");
        error.put("header", ex.getHeaderName());
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Object> handleNoResourceFound(NoResourceFoundException ex) {
        log.warn("Recurso não encontrado: {}", ex.getResourcePath());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Not Found");
        error.put("message", "O recurso solicitado não existe");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.error(">>> [DEBUG-CRITICAL] JSON PARSE ERROR: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Bad Request");

        String message = ex.getMessage();
        if (message != null && message.contains("UUID")) {
            error.put("message", "Formato de ID inválido. Verifique se todos os campos obrigatórios estão preenchidos corretamente.");
        } else if (message != null && message.contains("Cannot deserialize")) {
            error.put("message", "Dados inválidos no formulário. Verifique os campos e tente novamente.");
        } else {
            error.put("message", "Erro ao processar os dados enviados. Verifique o formulário.");
        }

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneric(Exception ex) {
        log.error(">>> [DEBUG-CRITICAL] UNEXPECTED ERROR: ", ex);
        Map<String, String> error = new HashMap<>();
        error.put("error", "Internal Server Error");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
