package com.axonrh.benefits.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.JsonMappingException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Object> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Recurso nao encontrado: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Not Found");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Object> handleBusiness(BusinessException ex) {
        log.warn("Erro de negocio: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Business Rule Violation");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex) {
        log.error("Acesso negado: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("code", "FORBIDDEN");
        error.put("message", "Você não tem permissão para realizar esta ação.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException ex) {
        log.error("Erro de validação: {}", ex.getMessage());
        Map<String, Object> response = new HashMap<>();
        response.put("error", "Validation Error");
        
        Map<String, String> details = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e ->
                details.put(e.getField(), e.getDefaultMessage())
        );
        
        String summary = details.values().stream().findFirst().orElse("Erro de validação nos campos.");
        response.put("message", summary);
        response.put("details", details);
        
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Object> handleMissingHeader(MissingRequestHeaderException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Missing Header");
        error.put("header", ex.getHeaderName());
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Object> handleNoResourceFound(NoResourceFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Not Found");
        error.put("message", "O recurso solicitado nao existe");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.error("Erro ao processar JSON: {}", ex.getMessage());
        Map<String, Object> error = new HashMap<>();
        error.put("error", "Bad Request");
        
        String message = "Erro ao processar os dados enviados. Verifique o formulário.";
        Throwable cause = ex.getCause();
        
        if (cause instanceof InvalidFormatException) {
            InvalidFormatException ife = (InvalidFormatException) cause;
            String fieldName = ife.getPath().isEmpty() ? "campo" : ife.getPath().get(ife.getPath().size()-1).getFieldName();
            
            if (ife.getTargetType() != null && ife.getTargetType().isEnum()) {
                message = String.format("O valor '%s' não é válido para o campo '%s'. Valores aceitos: %s",
                        ife.getValue(), fieldName, java.util.Arrays.toString(ife.getTargetType().getEnumConstants()));
            } else {
                message = "Formato inválido para o campo '" + fieldName + "'.";
            }
        }
        
        error.put("message", message);
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneric(Exception ex) {
        log.error("Erro inesperado: ", ex);
        Map<String, String> error = new HashMap<>();
        error.put("error", "Internal Server Error");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
