package com.axonrh.config.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Excecao lancada quando uma configuracao nao e encontrada.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ConfigNotFoundException extends RuntimeException {

    public ConfigNotFoundException(String message) {
        super(message);
    }

    public ConfigNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
