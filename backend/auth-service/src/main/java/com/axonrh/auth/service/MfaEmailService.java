package com.axonrh.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Serviço responsável por enviar o email de configuração obrigatória de MFA,
 * com branding do tenant obtido do config-service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MfaEmailService {

    private final JavaMailSender mailSender;
    private final RestTemplate restTemplate;

    @Value("${axonrh.mail.from}")
    private String fromEmail;

    @Value("${axonrh.mail.from-name}")
    private String fromName;

    @Value("${axonrh.services.config-service-url}")
    private String configServiceUrl;

    /**
     * Envia o email de configuração MFA de forma assíncrona.
     *
     * @param toEmail     Email do destinatário
     * @param userName    Nome do usuário
     * @param qrCodeBase64 QR Code em Base64 (PNG)
     * @param secret      Segredo TOTP para entrada manual
     * @param tenantId    ID do tenant para buscar branding
     */
    @Async
    public void sendMfaSetupEmail(String toEmail, String userName, String qrCodeBase64,
                                   String secret, String tenantId) {
        try {
            BrandingInfo branding = fetchBranding(tenantId);
            String html = buildEmailHtml(userName, qrCodeBase64, secret, branding);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Configure sua autenticação em duas etapas (MFA) — " + branding.companyName);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Email de configuração MFA enviado para: {}", toEmail);
        } catch (Exception e) {
            log.error("Falha ao enviar email de configuração MFA para {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private BrandingInfo fetchBranding(String tenantId) {
        BrandingInfo defaults = new BrandingInfo(
                "AxonRH",
                null,
                "#1E40AF",
                "#1E293B"
        );

        if (tenantId == null) return defaults;

        try {
            Map<String, Object> config = restTemplate.getForObject(
                    configServiceUrl + "/api/v1/config/theme/" + tenantId,
                    Map.class
            );
            if (config == null) return defaults;

            String companyName = config.containsKey("companyName") && config.get("companyName") != null
                    ? (String) config.get("companyName")
                    : "AxonRH";
            String logoUrl = (String) config.get("logoUrl");
            String primary = config.containsKey("primaryColor")
                    ? (String) config.get("primaryColor")
                    : defaults.primaryColor;
            String secondary = config.containsKey("secondaryColor")
                    ? (String) config.get("secondaryColor")
                    : defaults.secondaryColor;

            return new BrandingInfo(companyName, logoUrl, primary, secondary);
        } catch (Exception e) {
            log.warn("Não foi possível buscar branding do tenant {}: {}", tenantId, e.getMessage());
            return defaults;
        }
    }

    private String buildEmailHtml(String userName, String qrCodeBase64,
                                   String secret, BrandingInfo branding) {
        String logoHtml = branding.logoUrl != null
                ? "<img src=\"" + branding.logoUrl + "\" alt=\"" + escapeHtml(branding.companyName)
                  + "\" style=\"max-height:52px;max-width:220px;border:0;display:block;margin:0 auto;\" border=\"0\">"
                : "<span style=\"font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;\">"
                  + escapeHtml(branding.companyName) + "</span>";

        String formattedSecret = formatSecret(secret);

        return "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">"
            + "<html xmlns=\"http://www.w3.org/1999/xhtml\" lang=\"pt-BR\">"
            + "<head>"
            + "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />"
            + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>"
            + "<title>Configure seu MFA</title>"
            + "</head>"
            + "<body style=\"margin:0;padding:0;background-color:#f0f4f8;\">"

            // Wrapper externo
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color:#f0f4f8;\">"
            + "<tr><td align=\"center\" style=\"padding:32px 16px;\">"

            // Card principal
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"580\" style=\"background-color:#ffffff;border-radius:12px;overflow:hidden;\">"

            // ── HEADER ──
            + "<tr><td align=\"center\" bgcolor=\"" + branding.primaryColor + "\" style=\"background-color:" + branding.primaryColor + ";padding:28px 40px;\">"
            + logoHtml
            + "</td></tr>"

            // ── BANNER DE SEGURANÇA ──
            + "<tr><td bgcolor=\"#fffbeb\" style=\"background-color:#fffbeb;border-bottom:1px solid #fcd34d;padding:12px 40px;text-align:center;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"><tr>"
            + "<td align=\"center\" style=\"font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#92400e;\">"
            + "&#128274;&nbsp;<strong>Acesso a dados pessoais requer MFA ativo.</strong>&nbsp;Não compartilhe este email com ninguém."
            + "</td></tr></table>"
            + "</td></tr>"

            // ── SAUDAÇÃO ──
            + "<tr><td style=\"padding:36px 40px 0 40px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">"
            + "<tr><td style=\"font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#0f172a;padding-bottom:10px;\">Olá, " + escapeHtml(firstName(userName)) + " &#128075;</td></tr>"
            + "<tr><td style=\"font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#475569;line-height:1.7;padding-bottom:28px;\">"
            + "Por tratar dados pessoais conforme a <strong>LGPD</strong>, o acesso ao <strong>" + escapeHtml(branding.companyName) + "</strong> exige a autenticação em duas etapas (<strong>MFA</strong>)."
            + "</td></tr>"
            + "</table>"
            + "</td></tr>"

            // ── PASSOS (tabela, sem flexbox) ──
            + "<tr><td style=\"padding:0 40px 28px 40px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;\">"
            + "<tr><td style=\"padding:20px 20px 8px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#0f172a;\">Como configurar em 3 passos simples:</td></tr>"
            + step("1", branding.primaryColor, "Baixe um aplicativo autenticador",
                    "Recomendamos <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong> ou <strong>Authy</strong>.")
            + step("2", branding.primaryColor, "Escaneie o QR Code abaixo",
                    "Abra o app e toque em <em>\"Adicionar conta\"</em> &rarr; <em>\"Escanear QR Code\"</em>.")
            + step("3", branding.primaryColor, "Insira o código de 6 dígitos",
                    "O app gerará um código. Digite-o na tela de login para concluir o acesso.")
            + "</table>"
            + "</td></tr>"

            // ── QR CODE ──
            + "<tr><td align=\"center\" style=\"padding:0 40px 28px 40px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\">"
            + "<p style=\"margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#374151;\">Escaneie com seu aplicativo autenticador:</p>"
            + "<table border=\"0\" cellpadding=\"16\" cellspacing=\"0\" style=\"background-color:#ffffff;border:2px solid " + branding.primaryColor + ";border-radius:10px;\">"
            + "<tr><td align=\"center\"><img src=\"data:image/png;base64," + qrCodeBase64 + "\" alt=\"QR Code MFA\" width=\"200\" height=\"200\" style=\"display:block;border:0;\" /></td></tr>"
            + "</table>"
            + "</td></tr></table>"
            + "</td></tr>"

            // ── CHAVE MANUAL ──
            + "<tr><td style=\"padding:0 40px 28px 40px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color:#f0fdf4;border-radius:10px;border:1px solid #86efac;\">"
            + "<tr><td align=\"center\" style=\"padding:18px 24px;\">"
            + "<p style=\"margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;color:#166534;letter-spacing:1px;\">&#128273;&nbsp;CHAVE PARA INSERÇÃO MANUAL</p>"
            + "<p style=\"margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#166534;\">Se não conseguir escanear o QR Code, insira esta chave diretamente no app:</p>"
            + "<p style=\"margin:0;font-family:'Courier New',Courier,monospace;font-size:20px;font-weight:bold;color:#15803d;letter-spacing:4px;\">" + escapeHtml(formattedSecret) + "</p>"
            + "</td></tr>"
            + "</table>"
            + "</td></tr>"

            // ── APPS ──
            + "<tr><td align=\"center\" style=\"padding:0 40px 28px 40px;\">"
            + "<p style=\"margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;\">Ainda não tem um aplicativo autenticador?</p>"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\"><tr>"
            + "<td style=\"padding:0 4px;\"><a href=\"https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2\" style=\"display:inline-block;background-color:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:9px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#374151;text-decoration:none;\">Google Authenticator</a></td>"
            + "<td style=\"padding:0 4px;\"><a href=\"https://www.microsoft.com/pt-br/security/mobile-authenticator-app\" style=\"display:inline-block;background-color:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:9px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#374151;text-decoration:none;\">Microsoft Authenticator</a></td>"
            + "<td style=\"padding:0 4px;\"><a href=\"https://authy.com/download/\" style=\"display:inline-block;background-color:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:9px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#374151;text-decoration:none;\">Authy</a></td>"
            + "</tr></table>"
            + "</td></tr>"

            // ── AVISO FINAL ──
            + "<tr><td style=\"padding:0 40px 36px 40px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"border-left:4px solid #ef4444;background-color:#fef2f2;border-radius:0 8px 8px 0;\">"
            + "<tr><td style=\"padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#991b1b;line-height:1.6;\">"
            + "<strong>&#9888; Atenção:</strong> Nunca compartilhe o QR Code ou a chave acima. Em caso de dúvidas, entre em contato com o administrador do sistema."
            + "</td></tr>"
            + "</table>"
            + "</td></tr>"

            // ── FOOTER ──
            + "<tr><td bgcolor=\"#f8fafc\" style=\"background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;border-radius:0 0 12px 12px;\">"
            + "<p style=\"margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;\">Este email foi enviado automaticamente por " + escapeHtml(branding.companyName) + ".</p>"
            + "<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#cbd5e1;\">Powered by AxonRH &bull; Sistema de Gest&atilde;o de RH</p>"
            + "</td></tr>"

            + "</table>"
            + "</td></tr></table>"
            + "</body></html>";
    }

    private String step(String number, String color, String title, String description) {
        return "<tr><td style=\"padding:8px 20px 8px 20px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">"
            + "<tr>"
            + "<td width=\"36\" valign=\"top\" style=\"padding-right:14px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\"><tr>"
            + "<td align=\"center\" width=\"28\" height=\"28\" style=\"background-color:" + color + ";border-radius:50%;width:28px;height:28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#ffffff;text-align:center;line-height:28px;\">" + number + "</td>"
            + "</tr></table>"
            + "</td>"
            + "<td valign=\"top\">"
            + "<p style=\"margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#1e293b;\">" + title + "</p>"
            + "<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;line-height:1.6;\">" + description + "</p>"
            + "</td>"
            + "</tr></table>"
            + "</td></tr>";
    }

    private String formatSecret(String secret) {
        if (secret == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < secret.length(); i++) {
            if (i > 0 && i % 4 == 0) sb.append(" ");
            sb.append(secret.charAt(i));
        }
        return sb.toString();
    }

    private String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "usuário";
        return fullName.split(" ")[0];
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;");
    }

    record BrandingInfo(String companyName, String logoUrl, String primaryColor, String secondaryColor) {}
}
