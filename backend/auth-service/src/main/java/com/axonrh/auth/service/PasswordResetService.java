package com.axonrh.auth.service;

import com.axonrh.auth.entity.PasswordResetToken;
import com.axonrh.auth.entity.User;
import com.axonrh.auth.exception.AuthenticationException;
import com.axonrh.auth.repository.PasswordResetTokenRepository;
import com.axonrh.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Serviço de redefinição de senha via email.
 * Fluxo: solicitar token → validar → redefinir.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int TOKEN_EXPIRY_HOURS = 1;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetEmailService emailService;
    private final AuditService auditService;

    @Value("${axonrh.frontend-url:https://axonrh.mjolnix.com.br}")
    private String frontendUrl;

    /**
     * Solicita redefinição de senha.
     * Sempre retorna sem erro para não expor se o email existe (user enumeration).
     */
    @Transactional
    public void requestReset(String email) {
        log.info("Password reset requested for email: {}", email);

        userRepository.findByEmail(email).ifPresent(user -> {
            // Invalida tokens anteriores não usados
            tokenRepository.invalidateAllForUser(user.getId(), LocalDateTime.now());

            String tokenValue = UUID.randomUUID().toString().replace("-", "");
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .token(tokenValue)
                    .expiresAt(LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS))
                    .build();
            tokenRepository.save(resetToken);

            String resetLink = frontendUrl + "/reset-password?token=" + tokenValue;
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink,
                    user.getTenantId() != null ? user.getTenantId().toString() : null);

            log.info("Password reset token generated for user: {}", user.getId());
        });
    }

    /**
     * Redefine a senha usando o token recebido por email.
     */
    @Transactional
    public void resetPassword(String tokenValue, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new AuthenticationException("Token inválido ou expirado"));

        if (!resetToken.isValid()) {
            throw new AuthenticationException("Token inválido ou expirado");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);

        resetToken.setUsedAt(LocalDateTime.now());
        tokenRepository.save(resetToken);

        auditService.log(com.axonrh.auth.entity.AuditLog.builder()
                .tenantId(user.getTenantId())
                .userId(user.getId())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .action("RESET_PASSWORD")
                .resource("USER")
                .resourceId(user.getId().toString())
                .status("SUCCESS")
                .details("Senha redefinida via token de recuperação")
                .build());

        log.info("Password reset completed for user: {}", user.getId());
    }
}
