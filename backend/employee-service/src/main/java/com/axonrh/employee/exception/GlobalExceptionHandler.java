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
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.JsonMappingException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Object> handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Recurso não encontrado: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Not Found");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Object> handleDuplicateResource(DuplicateResourceException ex) {
        log.warn("Recurso duplicado: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Conflict");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(InvalidOperationException.class)
    public ResponseEntity<Object> handleInvalidOperation(InvalidOperationException ex) {
        log.warn("Operação inválida: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Bad Request");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }


    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Acesso negado: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Acesso Negado");
        error.put("message", "Você não tem permissão para realizar esta ação. Entre em contato com o administrador se considerar isso um erro.");
        error.put("code", "FORBIDDEN");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException ex) {
        log.error(">>> [DEBUG-CRITICAL] VALIDATION FAILED: {}", ex.getMessage());
        Map<String, Object> response = new HashMap<>();
        response.put("error", "Validation Error");
        
        Map<String, String> details = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            details.put(error.getField(), error.getDefaultMessage())
        );
        
        String summary = details.values().stream()
                .findFirst()
                .orElse("Erro de validação nos campos.");
        
        response.put("message", summary);
        response.put("details", details);
        
        return ResponseEntity.badRequest().body(response);
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

        Throwable cause = ex.getCause();
        if (cause instanceof JsonMappingException) {
            JsonMappingException jme = (JsonMappingException) cause;
            String fieldName = "";
            if (!jme.getPath().isEmpty()) {
                JsonMappingException.Reference lastRef = jme.getPath().get(jme.getPath().size() - 1);
                fieldName = lastRef.getFieldName();
            }

            if (cause instanceof InvalidFormatException) {
                InvalidFormatException ife = (InvalidFormatException) cause;
                
                if (ife.getTargetType() != null && ife.getTargetType().isEnum()) {
                    String allowedValues = java.util.Arrays.toString(ife.getTargetType().getEnumConstants());
                    String message = String.format("O valor '%s' não é válido para o campo '%s'. Valores aceitos: %s",
                            ife.getValue(), fieldName, allowedValues);
                    error.put("message", message);
                    error.put("field", fieldName);
                } else {
                    error.put("message", "Formato inválido para o campo '" + fieldName + "'. Verifique os dados enviados.");
                    error.put("field", fieldName);
                }
            } else {
                error.put("message", "Valor inválido ou incompatível para o campo '" + fieldName + "'. Verifique o formulário.");
                error.put("field", fieldName);
            }
        } else {
            String message = ex.getMessage();
            if (message != null && message.contains("UUID")) {
                error.put("message", "Formato de ID inválido. Verifique se todos os campos obrigatórios estão preenchidos corretamente.");
            } else {
                error.put("message", "Erro ao processar os dados enviados. Verifique o formulário.");
            }
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
