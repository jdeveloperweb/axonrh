package com.axonrh.config.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Excecao lancada quando uma cor e invalida ou nao atende aos requisitos de contraste.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidColorException extends RuntimeException {

    public InvalidColorException(String message) {
        super(message);
    }

    public InvalidColorException(String message, Throwable cause) {
        super(message, cause);
    }
}
