package com.axonrh.auth.service;

import com.axonrh.auth.dto.MfaSetupResponse;
import com.axonrh.auth.entity.User;
import com.axonrh.auth.repository.UserRepository;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrDataFactory;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MfaService {

    private final UserRepository userRepository;
    private final SecretGenerator secretGenerator;
    private final QrDataFactory qrDataFactory;
    private final CodeVerifier codeVerifier;
    private final ZxingPngQrGenerator qrGenerator;
    private final MfaEmailService mfaEmailService;

    @Value("${axonrh.mfa.setup-token-ttl-minutes:30}")
    private int setupTokenTtlMinutes;

    /**
     * Inicia o processo de configuração do MFA para o usuário (fluxo manual, autenticado).
     */
    public MfaSetupResponse setupMfa(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String secret = secretGenerator.generate();

        QrData data = qrDataFactory.newBuilder()
                .label(user.getEmail())
                .issuer("AxonRH")
                .secret(secret)
                .digits(6)
                .period(30)
                .build();

        return MfaSetupResponse.builder()
                .secret(secret)
                .qrCodeUrl(data.getUri())
                .build();
    }

    /**
     * Ativa o MFA para o usuário após validar o primeiro código (fluxo manual, autenticado).
     */
    @Transactional
    public void enableMfa(UUID userId, String secret, String code) {
        if (!codeVerifier.isValidCode(secret, code)) {
            throw new RuntimeException("Código inválido");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        user.setTwoFactorSecret(secret);
        user.setTwoFactorEnabled(true);
        userRepository.save(user);

        log.info("MFA enabled for user: {}", userId);
    }

    /**
     * Desativa o MFA para o usuário.
     */
    @Transactional
    public void disableMfa(UUID userId, String code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (!user.isTwoFactorEnabled()) {
            throw new RuntimeException("MFA não está ativado");
        }

        if (!codeVerifier.isValidCode(user.getTwoFactorSecret(), code)) {
            throw new RuntimeException("Código inválido");
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);

        log.info("MFA disabled for user: {}", userId);
    }

    /**
     * Inicia o fluxo de configuração OBRIGATÓRIA do MFA.
     * Se já existe um setup pendente e ainda válido, reutiliza o mesmo segredo/token
     * (apenas reenvia o email) para não invalidar o QR que o usuário já escaneou.
     */
    @Transactional
    public String initiateMandatorySetup(User user) {
        boolean hasValidPending = user.getTwoFactorPendingSecret() != null
                && user.getTwoFactorSetupToken() != null
                && user.getTwoFactorSetupTokenExpiresAt() != null
                && LocalDateTime.now().isBefore(user.getTwoFactorSetupTokenExpiresAt());

        String secret;
        String setupToken;

        if (hasValidPending) {
            // Reutiliza o segredo/token existente — não invalida o QR já escaneado
            secret = user.getTwoFactorPendingSecret();
            setupToken = user.getTwoFactorSetupToken();
            log.info("Reusing existing MFA pending setup for user: {}", user.getId());
        } else {
            // Gera novo segredo e token apenas se não há pendente válido
            secret = secretGenerator.generate();
            setupToken = UUID.randomUUID().toString().replace("-", "");

            user.setTwoFactorPendingSecret(secret);
            user.setTwoFactorSetupToken(setupToken);
            user.setTwoFactorSetupTokenExpiresAt(LocalDateTime.now().plusMinutes(setupTokenTtlMinutes));
            userRepository.save(user);

            log.info("New MFA mandatory setup initiated for user: {}", user.getId());
        }

        String qrCodeBase64 = generateQrCodeBase64(user.getEmail(), secret);

        mfaEmailService.sendMfaSetupEmail(
                user.getEmail(),
                user.getName(),
                qrCodeBase64,
                secret,
                user.getTenantId() != null ? user.getTenantId().toString() : null
        );

        return setupToken;
    }

    /**
     * Conclui o fluxo de configuração obrigatória do MFA:
     * - Valida o setupToken no banco
     * - Valida o código TOTP contra o segredo pendente
     * - Promove o segredo pendente para ativo e habilita o MFA
     */
    @Transactional
    public User completeMandatorySetup(String setupToken, String code) {
        User user = userRepository.findByTwoFactorSetupToken(setupToken)
                .orElseThrow(() -> new RuntimeException(
                        "Token de configuração inválido. Faça login novamente."));

        if (user.getTwoFactorSetupTokenExpiresAt() == null
                || LocalDateTime.now().isAfter(user.getTwoFactorSetupTokenExpiresAt())) {
            clearSetupToken(user);
            throw new RuntimeException(
                    "Token de configuração expirado. Faça login novamente.");
        }

        if (user.getTwoFactorPendingSecret() == null) {
            throw new RuntimeException(
                    "Nenhuma configuração de MFA pendente. Faça login novamente.");
        }

        if (!codeVerifier.isValidCode(user.getTwoFactorPendingSecret(), code)) {
            throw new RuntimeException(
                    "Código inválido. Verifique o código no seu aplicativo autenticador.");
        }

        user.setTwoFactorSecret(user.getTwoFactorPendingSecret());
        user.setTwoFactorPendingSecret(null);
        user.setTwoFactorEnabled(true);
        clearSetupToken(user);
        userRepository.save(user);

        log.info("Mandatory MFA setup completed for user: {}", user.getId());
        return user;
    }

    /**
     * Reenvio do email de configuração MFA (mantendo o mesmo token).
     */
    @Transactional
    public void resendSetupEmail(String setupToken) {
        User user = userRepository.findByTwoFactorSetupToken(setupToken)
                .orElseThrow(() -> new RuntimeException(
                        "Token de configuração inválido. Faça login novamente."));

        if (user.getTwoFactorSetupTokenExpiresAt() == null
                || LocalDateTime.now().isAfter(user.getTwoFactorSetupTokenExpiresAt())) {
            clearSetupToken(user);
            throw new RuntimeException(
                    "Token expirado. Faça login novamente para receber um novo email.");
        }

        if (user.getTwoFactorPendingSecret() == null) {
            throw new RuntimeException("Nenhuma configuração pendente encontrada.");
        }

        String qrCodeBase64 = generateQrCodeBase64(user.getEmail(), user.getTwoFactorPendingSecret());

        mfaEmailService.sendMfaSetupEmail(
                user.getEmail(),
                user.getName(),
                qrCodeBase64,
                user.getTwoFactorPendingSecret(),
                user.getTenantId() != null ? user.getTenantId().toString() : null
        );

        log.info("MFA setup email resent for user: {}", user.getId());
    }

    /**
     * Gera o QR Code como string Base64 (PNG).
     */
    public String generateQrCodeBase64(String email, String secret) {
        try {
            QrData data = qrDataFactory.newBuilder()
                    .label(email)
                    .issuer("AxonRH")
                    .secret(secret)
                    .digits(6)
                    .period(30)
                    .build();

            byte[] qrCodeBytes = qrGenerator.generate(data);
            return Base64.getEncoder().encodeToString(qrCodeBytes);
        } catch (QrGenerationException e) {
            log.error("Falha ao gerar QR code para {}: {}", email, e.getMessage());
            return "";
        }
    }

    private void clearSetupToken(User user) {
        user.setTwoFactorSetupToken(null);
        user.setTwoFactorSetupTokenExpiresAt(null);
        userRepository.save(user);
    }
}
