package com.axonrh.config.dto;

import lombok.*;

/**
 * DTO de resposta para upload de logo.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogoUploadResponse {

    private String url;
    private String fileName;
    private String contentType;
    private Long sizeBytes;
    private String message;

    public static LogoUploadResponse success(String url, String fileName, String contentType, Long size) {
        return LogoUploadResponse.builder()
                .url(url)
                .fileName(fileName)
                .contentType(contentType)
                .sizeBytes(size)
                .message("Logo enviado com sucesso")
                .build();
    }
}
