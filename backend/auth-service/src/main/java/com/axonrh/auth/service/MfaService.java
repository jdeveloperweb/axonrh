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
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MfaService {

    private final UserRepository userRepository;
    private final SecretGenerator secretGenerator;
    private final QrDataFactory qrDataFactory;
    private final CodeVerifier codeVerifier;
    private final ZxingPngQrGenerator qrGenerator;
    private final StringRedisTemplate redisTemplate;
    private final MfaEmailService mfaEmailService;

    @Value("${axonrh.mfa.setup-token-ttl-minutes:30}")
    private int setupTokenTtlMinutes;

    private static final String MFA_SETUP_KEY_PREFIX = "mfa_setup:";

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
     * Inicia o fluxo de configuração OBRIGATÓRIA do MFA:
     * - Gera segredo TOTP e salva como pendente no usuário
     * - Gera QR code e envia email com branding do tenant
     * - Retorna um token temporário (Redis) para o frontend usar no /complete-mandatory-setup
     */
    @Transactional
    public String initiateMandatorySetup(User user) {
        String secret = secretGenerator.generate();

        // Salva segredo pendente (não ativo ainda)
        user.setTwoFactorPendingSecret(secret);
        userRepository.save(user);

        // Gera QR code como PNG base64
        String qrCodeBase64 = generateQrCodeBase64(user.getEmail(), secret);

        // Gera token de setup e armazena no Redis
        String setupToken = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                MFA_SETUP_KEY_PREFIX + setupToken,
                user.getId().toString(),
                setupTokenTtlMinutes,
                TimeUnit.MINUTES
        );

        // Envia email de forma assíncrona
        mfaEmailService.sendMfaSetupEmail(
                user.getEmail(),
                user.getName(),
                qrCodeBase64,
                secret,
                user.getTenantId() != null ? user.getTenantId().toString() : null
        );

        log.info("Mandatory MFA setup initiated for user: {}", user.getId());
        return setupToken;
    }

    /**
     * Conclui o fluxo de configuração obrigatória do MFA:
     * - Valida o setupToken no Redis
     * - Valida o código TOTP contra o segredo pendente
     * - Promove o segredo pendente para ativo e habilita o MFA
     */
    @Transactional
    public User completeMandatorySetup(String setupToken, String code) {
        String userId = redisTemplate.opsForValue().get(MFA_SETUP_KEY_PREFIX + setupToken);
        if (userId == null) {
            throw new RuntimeException("Token de configuração expirado ou inválido. Faça login novamente.");
        }

        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (user.getTwoFactorPendingSecret() == null) {
            throw new RuntimeException("Nenhuma configuração de MFA pendente. Faça login novamente.");
        }

        if (!codeVerifier.isValidCode(user.getTwoFactorPendingSecret(), code)) {
            throw new RuntimeException("Código inválido. Verifique o código no seu aplicativo autenticador.");
        }

        // Ativa o MFA
        user.setTwoFactorSecret(user.getTwoFactorPendingSecret());
        user.setTwoFactorPendingSecret(null);
        user.setTwoFactorEnabled(true);
        userRepository.save(user);

        // Remove o token do Redis
        redisTemplate.delete(MFA_SETUP_KEY_PREFIX + setupToken);

        log.info("Mandatory MFA setup completed for user: {}", user.getId());
        return user;
    }

    /**
     * Reenvio do email de configuração MFA (usando o mesmo token existente).
     */
    @Transactional
    public void resendSetupEmail(String setupToken) {
        String userId = redisTemplate.opsForValue().get(MFA_SETUP_KEY_PREFIX + setupToken);
        if (userId == null) {
            throw new RuntimeException("Token de configuração expirado. Faça login novamente para receber um novo email.");
        }

        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

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
}
