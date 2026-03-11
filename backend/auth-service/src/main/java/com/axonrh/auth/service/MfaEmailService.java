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

            String companyName = config.containsKey("companyName")
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
                  + "\" style=\"max-height:48px;max-width:200px;object-fit:contain;\">"
                : "<span style=\"font-size:24px;font-weight:700;color:" + branding.primaryColor + ";\">"
                  + escapeHtml(branding.companyName) + "</span>";

        // Formata o segredo em grupos de 4 para facilitar a leitura
        String formattedSecret = formatSecret(secret);

        return "<!DOCTYPE html>" +
            "<html lang=\"pt-BR\">" +
            "<head>" +
            "<meta charset=\"UTF-8\">" +
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
            "<title>Configure seu MFA</title>" +
            "</head>" +
            "<body style=\"margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\">" +
            "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f1f5f9;padding:32px 16px;\">" +
            "<tr><td align=\"center\">" +
            "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;\">" +

            // Header
            "<tr><td style=\"background:" + branding.primaryColor + ";padding:28px 40px;text-align:center;\">" +
            logoHtml +
            "</td></tr>" +

            // Aviso de segurança
            "<tr><td style=\"background:#fef3c7;padding:14px 40px;text-align:center;border-bottom:1px solid #fde68a;\">" +
            "<p style=\"margin:0;font-size:13px;color:#92400e;\">" +
            "<strong>&#128274; Acesso a dados pessoais requer MFA ativo.</strong> " +
            "Este email contém informações sensíveis — não compartilhe com ninguém." +
            "</p>" +
            "</td></tr>" +

            // Corpo
            "<tr><td style=\"padding:36px 40px;\">" +
            "<p style=\"margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;\">Olá, " + escapeHtml(firstName(userName)) + " &#128075;</p>" +
            "<p style=\"margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;\">" +
            "Por tratar dados pessoais conforme a <strong>LGPD</strong>, o acesso ao " +
            escapeHtml(branding.companyName) + " exige a autenticação em duas etapas (<strong>MFA</strong>)." +
            "</p>" +

            // Passos
            "<div style=\"background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #e2e8f0;\">" +
            "<p style=\"margin:0 0 16px;font-size:15px;font-weight:600;color:#0f172a;\">Como configurar em 3 passos simples:</p>" +

            step("1", branding.primaryColor, "Baixe um aplicativo autenticador",
                "Recomendamos <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong> ou <strong>Authy</strong>.") +
            step("2", branding.primaryColor, "Escaneie o QR Code abaixo",
                "Abra o aplicativo e toque em <em>\"Adicionar conta\"</em> → <em>\"Escanear QR Code\"</em>.") +
            step("3", branding.primaryColor, "Insira o código de 6 dígitos",
                "Após escanear, o aplicativo gerará um código. Digite-o na tela de login para concluir.") +
            "</div>" +

            // QR Code
            "<div style=\"text-align:center;margin-bottom:28px;\">" +
            "<p style=\"margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;\">Escaneie com seu aplicativo autenticador:</p>" +
            "<div style=\"display:inline-block;background:#ffffff;padding:16px;border-radius:12px;border:2px solid " + branding.primaryColor + ";\">" +
            "<img src=\"data:image/png;base64," + qrCodeBase64 + "\" alt=\"QR Code MFA\" width=\"200\" height=\"200\" style=\"display:block;\">" +
            "</div>" +
            "</div>" +

            // Chave manual
            "<div style=\"background:#f0fdf4;border-radius:10px;padding:18px 24px;margin-bottom:28px;border:1px solid #bbf7d0;text-align:center;\">" +
            "<p style=\"margin:0 0 6px;font-size:12px;color:#166534;font-weight:600;\">&#128273; CHAVE PARA INSERÇÃO MANUAL</p>" +
            "<p style=\"margin:0 0 4px;font-size:12px;color:#166534;\">Se não conseguir escanear, insira esta chave manualmente no app:</p>" +
            "<p style=\"margin:0;font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:#15803d;letter-spacing:3px;\">" +
            escapeHtml(formattedSecret) + "</p>" +
            "</div>" +

            // Links de download
            "<div style=\"text-align:center;margin-bottom:28px;\">" +
            "<p style=\"margin:0 0 12px;font-size:13px;color:#64748b;\">Não tem um aplicativo? Baixe agora:</p>" +
            "<a href=\"https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2\" style=\"display:inline-block;margin:4px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:8px 16px;font-size:13px;color:#374151;text-decoration:none;\">&#128241; Google Authenticator</a>" +
            "<a href=\"https://play.google.com/store/apps/details?id=com.azure.authenticator\" style=\"display:inline-block;margin:4px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:8px 16px;font-size:13px;color:#374151;text-decoration:none;\">&#128737;&#65039; Microsoft Authenticator</a>" +
            "<a href=\"https://authy.com/download/\" style=\"display:inline-block;margin:4px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:8px 16px;font-size:13px;color:#374151;text-decoration:none;\">&#128274; Authy</a>" +
            "</div>" +

            // Aviso importante
            "<div style=\"background:#fef2f2;border-radius:10px;padding:16px 20px;border-left:4px solid #ef4444;\">" +
            "<p style=\"margin:0;font-size:13px;color:#7f1d1d;\">" +
            "<strong>&#9888;&#65039; Não compartilhe o QR Code ou a chave acima.</strong> " +
            "Estas informações concedem acesso à sua conta. Em caso de dúvidas, contate o administrador do sistema." +
            "</p>" +
            "</div>" +
            "</td></tr>" +

            // Footer
            "<tr><td style=\"background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;\">" +
            "<p style=\"margin:0 0 4px;font-size:12px;color:#94a3b8;\">Este email foi enviado automaticamente pelo sistema " + escapeHtml(branding.companyName) + ".</p>" +
            "<p style=\"margin:0;font-size:11px;color:#cbd5e1;\">Powered by AxonRH &bull; Sistema de Gestão de RH</p>" +
            "</td></tr>" +

            "</table>" +
            "</td></tr></table>" +
            "</body></html>";
    }

    private String step(String number, String color, String title, String description) {
        return "<div style=\"display:flex;align-items:flex-start;margin-bottom:14px;\">" +
                "<div style=\"flex-shrink:0;width:28px;height:28px;border-radius:50%;background:" + color + ";color:#fff;" +
                "display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;margin-right:14px;margin-top:2px;\">" +
                number + "</div>" +
                "<div>" +
                "<p style=\"margin:0 0 3px;font-size:14px;font-weight:600;color:#1e293b;\">" + title + "</p>" +
                "<p style=\"margin:0;font-size:13px;color:#64748b;line-height:1.5;\">" + description + "</p>" +
                "</div></div>";
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
