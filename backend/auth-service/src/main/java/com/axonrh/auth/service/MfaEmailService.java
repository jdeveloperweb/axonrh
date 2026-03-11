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
            if (userName != null && !userName.isBlank()) {
                helper.setTo(new jakarta.mail.internet.InternetAddress(toEmail, userName));
            } else {
                helper.setTo(toEmail);
            }
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
        // Header: white background, logo only (or company name text)
        String logoHtml = branding.logoUrl != null
                ? "<img src=\"" + branding.logoUrl + "\" alt=\"" + escapeHtml(branding.companyName)
                  + "\" style=\"max-height:48px;max-width:200px;border:0;display:block;margin:0 auto;\" border=\"0\">"
                : "<span style=\"font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;\">"
                  + escapeHtml(branding.companyName) + "</span>";

        String formattedSecret = formatSecret(secret);

        // Accent color for badges/borders
        String accent = branding.primaryColor != null ? branding.primaryColor : "#1E40AF";

        return "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">"
            + "<html xmlns=\"http://www.w3.org/1999/xhtml\" lang=\"pt-BR\">"
            + "<head>"
            + "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />"
            + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>"
            + "<title>Configure seu MFA — " + escapeHtml(branding.companyName) + "</title>"
            + "</head>"
            + "<body style=\"margin:0;padding:0;background-color:#f1f5f9;\">"

            // ── OUTER WRAPPER ──
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color:#f1f5f9;\">"
            + "<tr><td align=\"center\" style=\"padding:40px 16px;\">"

            // ── CARD ──
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"560\""
            + " style=\"background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;\">"

            // ── HEADER: white background, logo only, thin accent bottom border ──
            + "<tr><td align=\"center\" bgcolor=\"#ffffff\""
            + " style=\"background-color:#ffffff;padding:32px 40px 24px 40px;border-bottom:3px solid " + accent + ";\">"
            + logoHtml
            + "</td></tr>"

            // ── GREETING ──
            + "<tr><td style=\"padding:36px 40px 0 40px;\">"
            + "<p style=\"margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#0f172a;line-height:1.25;\">Olá, " + escapeHtml(firstName(userName)) + " 👋</p>"
            + "<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#64748b;line-height:1.7;\">"
            + "Por processar dados pessoais conforme a <strong style=\"color:#374151;\">LGPD</strong>, o acesso ao "
            + "<strong style=\"color:#374151;\">" + escapeHtml(branding.companyName) + "</strong> agora exige autenticação em duas etapas (MFA)."
            + "</p>"
            + "</td></tr>"

            // ── DIVIDER ──
            + "<tr><td style=\"padding:28px 40px 0 40px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">"
            + "<tr><td style=\"border-top:1px solid #e2e8f0;font-size:0;line-height:0;\">&nbsp;</td></tr>"
            + "</table>"
            + "</td></tr>"

            // ── STEPS ──
            + "<tr><td style=\"padding:24px 40px 0 40px;\">"
            + "<p style=\"margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#94a3b8;letter-spacing:1px;\">COMO CONFIGURAR</p>"
            + "</td></tr>"
            + "<tr><td style=\"padding:0 40px 0 40px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">"
            + stepClean("1", accent, "Baixe um aplicativo autenticador",
                    "Google Authenticator, Microsoft Authenticator ou Authy.")
            + stepClean("2", accent, "Escaneie o QR Code abaixo",
                    "Abra o app &rarr; toque em &ldquo;Adicionar conta&rdquo; &rarr; &ldquo;Escanear QR Code&rdquo;.")
            + stepClean("3", accent, "Digite o código de 6 dígitos",
                    "O app gerará um novo código a cada 30 segundos. Digite-o na tela de login.")
            + "</table>"
            + "</td></tr>"

            // ── QR CODE ──
            + "<tr><td align=\"center\" style=\"padding:32px 40px 0 40px;\">"
            + "<p style=\"margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#94a3b8;letter-spacing:1px;\">SEU QR CODE</p>"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\">"
            + "<tr><td align=\"center\" style=\"background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;\">"
            + "<img src=\"data:image/png;base64," + qrCodeBase64 + "\" alt=\"QR Code MFA\" width=\"200\" height=\"200\" style=\"display:block;border:0;\" />"
            + "</td></tr>"
            + "</table>"
            + "</td></tr>"

            // ── MANUAL KEY ──
            + "<tr><td style=\"padding:28px 40px 0 40px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\""
            + " style=\"background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;\">"
            + "<tr><td style=\"padding:20px 24px;\">"
            + "<p style=\"margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;color:#94a3b8;letter-spacing:1px;\">🔑&nbsp;CHAVE MANUAL (se não conseguir escanear)</p>"
            + "<p style=\"margin:0;font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:bold;color:#1e293b;letter-spacing:5px;\">"
            + escapeHtml(formattedSecret) + "</p>"
            + "</td></tr>"
            + "</table>"
            + "</td></tr>"

            // ── APPS ──
            + "<tr><td align=\"center\" style=\"padding:28px 40px 0 40px;\">"
            + "<p style=\"margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;\">Ainda não tem um app autenticador?</p>"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"4\"><tr>"
            + "<td><a href=\"https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2\""
            + " style=\"display:inline-block;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#374151;text-decoration:none;\">Google Auth</a></td>"
            + "<td><a href=\"https://www.microsoft.com/pt-br/security/mobile-authenticator-app\""
            + " style=\"display:inline-block;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#374151;text-decoration:none;\">Microsoft Auth</a></td>"
            + "<td><a href=\"https://authy.com/download/\""
            + " style=\"display:inline-block;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#374151;text-decoration:none;\">Authy</a></td>"
            + "</tr></table>"
            + "</td></tr>"

            // ── SECURITY NOTICE ──
            + "<tr><td style=\"padding:28px 40px 36px 40px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\""
            + " style=\"background-color:#fff7ed;border-radius:10px;border:1px solid #fed7aa;\">"
            + "<tr><td style=\"padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#9a3412;line-height:1.6;\">"
            + "<strong>⚠️ Importante:</strong> Nunca compartilhe este QR Code ou a chave manual. Em caso de dúvidas, contate o administrador."
            + "</td></tr>"
            + "</table>"
            + "</td></tr>"

            // ── FOOTER ──
            + "<tr><td bgcolor=\"#f8fafc\" style=\"background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;\">"
            + "<p style=\"margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;\">Email enviado automaticamente por " + escapeHtml(branding.companyName) + ".</p>"
            + "<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#cbd5e1;\">Powered by AxonRH</p>"
            + "</td></tr>"

            + "</table>"
            + "</td></tr></table>"
            + "</body></html>";
    }

    private String step(String number, String color, String title, String description) {
        return stepClean(number, color, title, description);
    }

    private String stepClean(String number, String color, String title, String description) {
        return "<tr><td style=\"padding:0 0 16px 0;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">"
            + "<tr>"
            + "<td width=\"36\" valign=\"top\" style=\"padding-right:14px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\"><tr>"
            + "<td align=\"center\" width=\"30\" height=\"30\""
            + " style=\"background-color:" + color + ";border-radius:50%;width:30px;height:30px;"
            + "font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;"
            + "color:#ffffff;text-align:center;line-height:30px;\">" + number + "</td>"
            + "</tr></table>"
            + "</td>"
            + "<td valign=\"top\" style=\"padding-top:4px;\">"
            + "<p style=\"margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#1e293b;\">" + title + "</p>"
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
