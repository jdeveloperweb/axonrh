package com.axonrh.auth.service;

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
 * Serviço responsável por enviar o email de redefinição de senha com branding do tenant.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetEmailService {

    private final JavaMailSender mailSender;
    private final RestTemplate restTemplate;

    @Value("${axonrh.mail.from}")
    private String fromEmail;

    @Value("${axonrh.mail.from-name}")
    private String fromName;

    @Value("${axonrh.services.config-service-url}")
    private String configServiceUrl;

    @Async
    public void sendPasswordResetEmail(String toEmail, String userName, String resetLink, String tenantId) {
        try {
            BrandingInfo branding = fetchBranding(tenantId);
            String html = buildEmailHtml(userName, resetLink, branding);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            if (userName != null && !userName.isBlank()) {
                helper.setTo(new jakarta.mail.internet.InternetAddress(toEmail, userName));
            } else {
                helper.setTo(toEmail);
            }
            helper.setSubject("Redefinição de senha — " + branding.companyName());
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Email de reset de senha enviado para: {}", toEmail);
        } catch (Exception e) {
            log.error("Falha ao enviar email de reset de senha para {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private BrandingInfo fetchBranding(String tenantId) {
        BrandingInfo defaults = new BrandingInfo("AxonRH", null, "#1E40AF");
        if (tenantId == null) return defaults;
        try {
            Map<String, Object> config = restTemplate.getForObject(
                    configServiceUrl + "/api/v1/config/theme/" + tenantId, Map.class);
            if (config == null) return defaults;
            String companyName = config.getOrDefault("companyName", "AxonRH").toString();
            String logoUrl = (String) config.get("logoUrl");
            String primary = config.containsKey("primaryColor") ? (String) config.get("primaryColor") : defaults.primaryColor();
            return new BrandingInfo(companyName, logoUrl, primary);
        } catch (Exception e) {
            log.warn("Não foi possível buscar branding do tenant {}: {}", tenantId, e.getMessage());
            return defaults;
        }
    }

    private String buildEmailHtml(String userName, String resetLink, BrandingInfo branding) {
        String accent = branding.primaryColor() != null ? branding.primaryColor() : "#1E40AF";
        String logoHtml = branding.logoUrl() != null
                ? "<img src=\"" + branding.logoUrl() + "\" alt=\"" + esc(branding.companyName())
                  + "\" style=\"max-height:48px;max-width:200px;border:0;display:block;margin:0 auto;\">"
                : "<span style=\"font-size:22px;font-weight:700;color:#0f172a;\">" + esc(branding.companyName()) + "</span>";

        return "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">"
            + "<html xmlns=\"http://www.w3.org/1999/xhtml\" lang=\"pt-BR\"><head>"
            + "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\"/>"
            + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"/>"
            + "<title>Redefinição de senha</title></head>"
            + "<body style=\"margin:0;padding:0;background-color:#f1f5f9;\">"

            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color:#f1f5f9;\">"
            + "<tr><td align=\"center\" style=\"padding:40px 16px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"560\""
            + " style=\"background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;\">"

            // Header
            + "<tr><td align=\"center\" bgcolor=\"#ffffff\""
            + " style=\"padding:32px 40px 24px;border-bottom:3px solid " + accent + ";\">"
            + logoHtml + "</td></tr>"

            // Body
            + "<tr><td style=\"padding:36px 40px 0;\">"
            + "<p style=\"margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#0f172a;\">Olá, " + esc(firstName(userName)) + " 👋</p>"
            + "<p style=\"margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#64748b;line-height:1.7;\">"
            + "Recebemos uma solicitação para redefinir a senha da sua conta em <strong style=\"color:#374151;\">" + esc(branding.companyName()) + "</strong>."
            + "</p>"
            + "<p style=\"margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#64748b;line-height:1.7;\">"
            + "Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong style=\"color:#374151;\">1 hora</strong>."
            + "</p>"
            + "</td></tr>"

            // CTA Button
            + "<tr><td align=\"center\" style=\"padding:0 40px 32px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\"><tr>"
            + "<td align=\"center\" bgcolor=\"" + accent + "\" style=\"border-radius:10px;\">"
            + "<a href=\"" + resetLink + "\" target=\"_blank\""
            + " style=\"display:inline-block;padding:14px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px;\">"
            + "Redefinir senha</a>"
            + "</td></tr></table>"
            + "</td></tr>"

            // Security notice
            + "<tr><td style=\"padding:0 40px 36px;\">"
            + "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\""
            + " style=\"background-color:#fff7ed;border-radius:10px;border:1px solid #fed7aa;\">"
            + "<tr><td style=\"padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#9a3412;line-height:1.6;\">"
            + "<strong>⚠️ Importante:</strong> Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma."
            + "</td></tr></table>"
            + "</td></tr>"

            // Link fallback
            + "<tr><td style=\"padding:0 40px 36px;\">"
            + "<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;line-height:1.6;\">"
            + "Se o botão não funcionar, copie e cole este link no seu navegador:<br/>"
            + "<span style=\"color:#3b82f6;word-break:break-all;\">" + resetLink + "</span>"
            + "</p></td></tr>"

            // Footer
            + "<tr><td bgcolor=\"#f8fafc\" style=\"background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;\">"
            + "<p style=\"margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;\">Email enviado automaticamente por " + esc(branding.companyName()) + ".</p>"
            + "<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#cbd5e1;\">Powered by AxonRH</p>"
            + "</td></tr>"

            + "</table></td></tr></table>"
            + "</body></html>";
    }

    private String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "usuário";
        return fullName.split(" ")[0];
    }

    private String esc(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    record BrandingInfo(String companyName, String logoUrl, String primaryColor) {}
}
