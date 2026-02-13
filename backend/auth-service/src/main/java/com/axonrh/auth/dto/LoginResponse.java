package com.axonrh.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO para resposta de login bem-sucedido.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn; // segundos
    private UserInfo user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private UUID id;
        private String name;
        private String email;
        private String avatarUrl;
        private UUID tenantId;
        private String tenantName;
        private List<String> roles;
        private List<String> permissions;
        private boolean twoFactorEnabled;
        private UUID employeeId;
    }
}
