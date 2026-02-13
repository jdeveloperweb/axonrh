package com.axonrh.auth.service;

import com.axonrh.auth.dto.LoginRequest;
import com.axonrh.auth.dto.LoginResponse;
import com.axonrh.auth.entity.Role;
import com.axonrh.auth.entity.User;
import com.axonrh.auth.exception.AuthenticationException;
import com.axonrh.auth.repository.LoginAttemptRepository;
import com.axonrh.auth.repository.RefreshTokenRepository;
import com.axonrh.auth.repository.UserRepository;
import com.axonrh.auth.security.JwtService;
import dev.samstevens.totp.code.CodeVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Testes unitarios do AuthService.
 * Casos de teste TDD conforme especificacao.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private LoginAttemptRepository loginAttemptRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private CodeVerifier totpCodeVerifier;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "maxLoginAttempts", 5);
        ReflectionTestUtils.setField(authService, "lockoutDurationMinutes", 15);

        testUser = User.builder()
                .id(UUID.randomUUID())
                .tenantId(UUID.randomUUID())
                .name("Test User")
                .email("test@example.com")
                .passwordHash("hashedPassword")
                .status(User.UserStatus.ACTIVE)
                .twoFactorEnabled(false)
                .failedLoginAttempts(0)
                .roles(new HashSet<>())
                .build();
    }

    @Test
    @DisplayName("T044: Credenciais validas devem gerar JWT")
    void shouldGenerateJwtForValidCredentials() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("validPassword")
                .build();

        when(userRepository.findByEmailWithRolesAndPermissions(anyString()))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtService.generateAccessToken(any(), anyString(), any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken()).thenReturn("refresh-token");
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(28800L);
        when(jwtService.getRefreshTokenExpirationMs()).thenReturn(604800000L);

        // When
        LoginResponse response = authService.login(request, "127.0.0.1", "TestAgent");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("T045: 5 tentativas invalidas devem bloquear a conta")
    void shouldLockAccountAfter5FailedAttempts() {
        // Given
        testUser.setFailedLoginAttempts(4); // Ja tem 4, proxima sera a 5a
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("wrongPassword")
                .build();

        when(userRepository.findByEmailWithRolesAndPermissions(anyString()))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> authService.login(request, "127.0.0.1", "TestAgent"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessageContaining("Credenciais invalidas");

        assertThat(testUser.getFailedLoginAttempts()).isEqualTo(5);
        assertThat(testUser.getLockedUntil()).isNotNull();
        assertThat(testUser.isLocked()).isTrue();
    }

    @Test
    @DisplayName("T046: Conta bloqueada deve retornar erro")
    void shouldReturnErrorForLockedAccount() {
        // Given
        testUser.setLockedUntil(LocalDateTime.now().plusMinutes(10));
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("validPassword")
                .build();

        when(userRepository.findByEmailWithRolesAndPermissions(anyString()))
                .thenReturn(Optional.of(testUser));

        // When & Then
        assertThatThrownBy(() -> authService.login(request, "127.0.0.1", "TestAgent"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessageContaining("Conta bloqueada");
    }

    @Test
    @DisplayName("T048: Usuario sem permissao deve receber 403")
    void shouldRequire2FAWhenEnabled() {
        // Given
        testUser.setTwoFactorEnabled(true);
        testUser.setTwoFactorSecret("JBSWY3DPEHPK3PXP");
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("validPassword")
                .totpCode(null) // Sem codigo 2FA
                .build();

        when(userRepository.findByEmailWithRolesAndPermissions(anyString()))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> authService.login(request, "127.0.0.1", "TestAgent"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessageContaining("2FA obrigatorio");
    }

    @Test
    @DisplayName("Codigo 2FA invalido deve retornar erro")
    void shouldRejectInvalid2FACode() {
        // Given
        testUser.setTwoFactorEnabled(true);
        testUser.setTwoFactorSecret("JBSWY3DPEHPK3PXP");
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("validPassword")
                .totpCode("123456")
                .build();

        when(userRepository.findByEmailWithRolesAndPermissions(anyString()))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(totpCodeVerifier.isValidCode(anyString(), anyString())).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> authService.login(request, "127.0.0.1", "TestAgent"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessageContaining("2FA invalido");
    }

    @Test
    @DisplayName("Usuario inexistente deve retornar erro generico")
    void shouldReturnGenericErrorForNonExistentUser() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .email("nonexistent@example.com")
                .password("anyPassword")
                .build();

        when(userRepository.findByEmailWithRolesAndPermissions(anyString()))
                .thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> authService.login(request, "127.0.0.1", "TestAgent"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessageContaining("Credenciais invalidas"); // Nao revelar que usuario nao existe
    }

    @Test
    @DisplayName("Login bem-sucedido deve resetar tentativas falhas")
    void shouldResetFailedAttemptsOnSuccessfulLogin() {
        // Given
        testUser.setFailedLoginAttempts(3);
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("validPassword")
                .build();

        when(userRepository.findByEmailWithRolesAndPermissions(anyString()))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtService.generateAccessToken(any(), anyString(), any())).thenReturn("token");
        when(jwtService.generateRefreshToken()).thenReturn("refresh");
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(28800L);
        when(jwtService.getRefreshTokenExpirationMs()).thenReturn(604800000L);

        // When
        authService.login(request, "127.0.0.1", "TestAgent");

        // Then
        assertThat(testUser.getFailedLoginAttempts()).isZero();
        assertThat(testUser.getLockedUntil()).isNull();
    }
}
