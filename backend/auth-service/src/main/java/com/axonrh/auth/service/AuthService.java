package com.axonrh.auth.service;

import com.axonrh.auth.dto.LoginRequest;
import com.axonrh.auth.dto.LoginResponse;
import com.axonrh.auth.dto.RefreshTokenRequest;
import com.axonrh.auth.entity.LoginAttempt;
import com.axonrh.auth.entity.RefreshToken;
import com.axonrh.auth.entity.User;
import com.axonrh.auth.exception.AuthenticationException;
import com.axonrh.auth.repository.LoginAttemptRepository;
import com.axonrh.auth.repository.RefreshTokenRepository;
import com.axonrh.auth.repository.UserRepository;
import com.axonrh.auth.security.JwtService;
import dev.samstevens.totp.code.CodeVerifier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Servico de autenticacao.
 * Implementa login, logout, refresh token e 2FA.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CodeVerifier totpCodeVerifier;

    @Value("${security.login.max-attempts}")
    private int maxLoginAttempts;

    @Value("${security.login.lockout-duration-minutes}")
    private int lockoutDurationMinutes;

    /**
     * Realiza o login do usuario.
     * Valida credenciais, 2FA (se ativado), e gera tokens.
     */
    @Transactional
    public LoginResponse login(LoginRequest request, String ipAddress, String userAgent) {
        log.info("Login attempt for email: {}", request.getEmail());

        // Busca usuario com roles e permissoes
        long count = userRepository.count();
        log.debug("Total users in database: {}", count);
        if (count > 0) {
            userRepository.findAll().forEach(u -> 
                log.debug("Found user in DB: email=[{}], tenantId=[{}]", u.getEmail(), u.getTenantId())
            );
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.error("User with email {} not found in database", request.getEmail());
                    recordLoginAttempt(request.getEmail(), null, null, false,
                            LoginAttempt.REASON_USER_NOT_FOUND, ipAddress, userAgent);
                    return new AuthenticationException("Credenciais invalidas");
                });

        // Verifica se a conta esta bloqueada
        if (user.isLocked()) {
            recordLoginAttempt(request.getEmail(), user.getTenantId(), user.getId(), false,
                    LoginAttempt.REASON_ACCOUNT_LOCKED, ipAddress, userAgent);
            throw new AuthenticationException("Conta bloqueada. Tente novamente em alguns minutos.");
        }

        // Verifica se a conta esta ativa
        if (!user.isActive()) {
            recordLoginAttempt(request.getEmail(), user.getTenantId(), user.getId(), false,
                    LoginAttempt.REASON_ACCOUNT_DISABLED, ipAddress, userAgent);
            throw new AuthenticationException("Conta desativada. Entre em contato com o administrador.");
        }

        // Valida senha
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user, ipAddress, userAgent);
            throw new AuthenticationException("Credenciais invalidas");
        }

        // Verifica 2FA se ativado
        if (user.isTwoFactorEnabled()) {
            if (request.getTotpCode() == null || request.getTotpCode().isBlank()) {
                throw new AuthenticationException("Codigo 2FA obrigatorio", "2FA_REQUIRED");
            }

            if (!totpCodeVerifier.isValidCode(user.getTwoFactorSecret(), request.getTotpCode())) {
                recordLoginAttempt(request.getEmail(), user.getTenantId(), user.getId(), false,
                        LoginAttempt.REASON_2FA_INVALID, ipAddress, userAgent);
                throw new AuthenticationException("Codigo 2FA invalido");
            }
        }

        // Login bem-sucedido
        user.resetFailedAttempts();
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Gera tokens
        UUID employeeId = userRepository.findEmployeeIdByUserId(user.getId()).orElse(null);
        String accessToken = jwtService.generateAccessToken(user, "", employeeId); // TODO: buscar tenant name
        String refreshToken = createRefreshToken(user, ipAddress, userAgent);

        // Registra tentativa de login bem-sucedida
        recordLoginAttempt(request.getEmail(), user.getTenantId(), user.getId(), true,
                null, ipAddress, userAgent);

        log.info("Login successful for user: {}", user.getId());

        return buildLoginResponse(user, employeeId, accessToken, refreshToken);
    }

    /**
     * Renova o access token usando um refresh token valido.
     */
    @Transactional
    public LoginResponse refreshToken(RefreshTokenRequest request, String ipAddress, String userAgent) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new AuthenticationException("Refresh token invalido"));

        if (!storedToken.isValid()) {
            throw new AuthenticationException("Refresh token expirado ou revogado");
        }

        User user = storedToken.getUser();

        // Revoga o token antigo
        storedToken.revoke();
        refreshTokenRepository.save(storedToken);

        // Gera novos tokens
        UUID employeeId = userRepository.findEmployeeIdByUserId(user.getId()).orElse(null);
        String accessToken = jwtService.generateAccessToken(user, "", employeeId);
        String newRefreshToken = createRefreshToken(user, ipAddress, userAgent);

        // Atualiza o token antigo com referencia ao novo
        storedToken.setReplacedByToken(newRefreshToken);
        refreshTokenRepository.save(storedToken);

        log.info("Token refreshed for user: {}", user.getId());

        return buildLoginResponse(user, employeeId, accessToken, newRefreshToken);
    }

    /**
     * Realiza logout revogando todos os refresh tokens do usuario.
     */
    @Transactional
    public void logout(String userId) {
        User user = userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new AuthenticationException("Usuario nao encontrado"));

        int revokedCount = refreshTokenRepository.revokeAllByUser(user, LocalDateTime.now());
        log.info("Logout: {} refresh tokens revoked for user {}", revokedCount, userId);
    }

    // === Metodos auxiliares ===

    private String createRefreshToken(User user, String ipAddress, String userAgent) {
        String tokenValue = jwtService.generateRefreshToken();

        RefreshToken refreshToken = RefreshToken.builder()
                .token(tokenValue)
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenExpirationMs() / 1000))
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }

    private void handleFailedLogin(User user, String ipAddress, String userAgent) {
        user.incrementFailedAttempts();

        if (user.getFailedLoginAttempts() >= maxLoginAttempts) {
            user.lock(lockoutDurationMinutes);
            log.warn("User {} locked after {} failed attempts", user.getId(), maxLoginAttempts);
        }

        userRepository.save(user);
        recordLoginAttempt(user.getEmail(), user.getTenantId(), user.getId(), false,
                LoginAttempt.REASON_INVALID_CREDENTIALS, ipAddress, userAgent);
    }

    private void recordLoginAttempt(String email, java.util.UUID tenantId, java.util.UUID userId,
                                    boolean success, String failureReason, String ipAddress, String userAgent) {
        LoginAttempt attempt = LoginAttempt.builder()
                .email(email)
                .tenantId(tenantId)
                .userId(userId)
                .success(success)
                .failureReason(failureReason)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        loginAttemptRepository.save(attempt);
    }

    private LoginResponse buildLoginResponse(User user, UUID employeeId, String accessToken, String refreshToken) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName())
                .toList();

        List<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(permission -> permission.getCode())
                .distinct()
                .toList();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpirationSeconds())
                .user(LoginResponse.UserInfo.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .avatarUrl(user.getAvatarUrl())
                        .tenantId(user.getTenantId())
                        .roles(roles)
                        .permissions(permissions)
                        .twoFactorEnabled(user.isTwoFactorEnabled())
                        .employeeId(employeeId)
                        .build())
                .build();
    }
}
