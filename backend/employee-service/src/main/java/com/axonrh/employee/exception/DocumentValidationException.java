package com.axonrh.employee.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when document validation fails.
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class DocumentValidationException extends RuntimeException {

    private final String documentType;
    private final String validationError;

    public DocumentValidationException(String message) {
        super(message);
        this.documentType = null;
        this.validationError = message;
    }

    public DocumentValidationException(String documentType, String validationError) {
        super(String.format("Validation failed for document %s: %s", documentType, validationError));
        this.documentType = documentType;
        this.validationError = validationError;
    }

    public DocumentValidationException(String message, Throwable cause) {
        super(message, cause);
        this.documentType = null;
        this.validationError = message;
    }

    public String getDocumentType() {
        return documentType;
    }

    public String getValidationError() {
        return validationError;
    }
}
