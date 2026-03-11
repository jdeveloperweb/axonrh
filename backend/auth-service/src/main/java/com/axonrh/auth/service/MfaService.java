package com.axonrh.auth.service;

import com.axonrh.auth.dto.MfaSetupResponse;
import com.axonrh.auth.entity.User;
import com.axonrh.auth.repository.UserRepository;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrDataFactory;
import dev.samstevens.totp.secret.SecretGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MfaService {

    private final UserRepository userRepository;
    private final SecretGenerator secretGenerator;
    private final QrDataFactory qrDataFactory;
    private final CodeVerifier codeVerifier;

    /**
     * Inicia o processo de configuração do MFA para o usuário.
     * Gera um novo segredo, mas não ativa ainda.
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
     * Ativa o MFA para o usuário após validar o primeiro código.
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
}
