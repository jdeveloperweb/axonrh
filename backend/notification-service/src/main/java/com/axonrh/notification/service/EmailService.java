package com.axonrh.notification.service;

import com.axonrh.notification.entity.EmailLog;
import com.axonrh.notification.entity.EmailLog.EmailStatus;
import com.axonrh.notification.entity.EmailTemplate;
import com.axonrh.notification.repository.EmailLogRepository;
import com.axonrh.notification.repository.EmailTemplateRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{(\\w+)}}");
    private static final UUID SYSTEM_TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    @Value("${email.from-address:noreply@axonrh.com}")
    private String fromAddress;

    @Value("${email.from-name:AxonRH}")
    private String fromName;

    @Value("${email.enabled:true}")
    private boolean emailEnabled;

    @Value("${email.provider:smtp}") // Pode ser 'ses' ou 'smtp'
    private String emailProvider;

    private final EmailTemplateRepository templateRepository;
    private final EmailLogRepository logRepository;
    private final SesV2Client sesClient;
    private final JavaMailSender mailSender;

    /**
     * Envia email usando template.
     */
    @Async
    public void sendTemplateEmail(UUID tenantId, String templateCode, String recipientEmail,
                                  String recipientName, Map<String, String> variables) {
        if (templateCode != null) templateCode = templateCode.trim();
        final String finalCode = templateCode;

        Optional<EmailTemplate> templateOpt = templateRepository.findByTenantIdAndCode(tenantId, finalCode)
                .or(() -> templateRepository.findSystemTemplate(SYSTEM_TENANT_ID, finalCode));

        EmailTemplate template;
        if (templateOpt.isEmpty()) {
            log.warn("Template de e-mail não encontrado no banco: code={}. Usando fallback hardcoded.", finalCode);
            template = getFallbackTemplate(finalCode);
            if (template == null) {
                log.error("Template de e-mail não encontrado nem no fallback: code={}, tenantId={}.", finalCode, tenantId);
                throw new IllegalArgumentException("Template não encontrado: " + finalCode);
            }
        } else {
            template = templateOpt.get();
        }

        String subject = replaceVariables(template.getSubject(), variables);
        String bodyHtml = replaceVariables(template.getBodyHtml(), variables);
        String bodyText = template.getBodyText() != null ?
                replaceVariables(template.getBodyText(), variables) : null;

        sendEmail(tenantId, recipientEmail, recipientName, subject, bodyHtml, bodyText,
                template, null, null);
    }

    /**
     * Envia email customizado.
     */
    @Async
    public void sendCustomEmail(UUID tenantId, String recipientEmail, String recipientName,
                                String subject, String bodyHtml, String bodyText) {
        sendEmail(tenantId, recipientEmail, recipientName, subject, bodyHtml, bodyText,
                null, null, null);
    }

    /**
     * Envia email com CC e BCC.
     */
    @Async
    public void sendEmailWithCopy(UUID tenantId, String recipientEmail, String recipientName,
                                  String subject, String bodyHtml, String[] ccEmails, String[] bccEmails) {
        sendEmail(tenantId, recipientEmail, recipientName, subject, bodyHtml, null,
                null, ccEmails, bccEmails);
    }

    private void sendEmail(UUID tenantId, String recipientEmail, String recipientName,
                           String subject, String bodyHtml, String bodyText,
                           EmailTemplate template, String[] ccEmails, String[] bccEmails) {
        // Create log entry
        EmailLog emailLog = new EmailLog();
        emailLog.setTenantId(tenantId);
        emailLog.setRecipientEmail(recipientEmail);
        emailLog.setRecipientName(recipientName);
        emailLog.setSubject(subject);
        emailLog.setBodyHtml(bodyHtml);
        emailLog.setBodyText(bodyText);
        emailLog.setCcEmails(ccEmails);
        emailLog.setBccEmails(bccEmails);
        emailLog.setProvider(emailProvider.toUpperCase());

        if (template != null) {
            emailLog.setTemplate(template);
            emailLog.setTemplateCode(template.getCode());
        }

        if (!emailEnabled) {
            log.info("Email disabled - would send to: {}", recipientEmail);
            emailLog.setStatus(EmailStatus.SENT);
            emailLog.setErrorMessage("Email disabled in configuration");
            logRepository.save(emailLog);
            return;
        }

        try {
            emailLog.setStatus(EmailStatus.SENDING);
            logRepository.save(emailLog);

            if ("ses".equalsIgnoreCase(emailProvider)) {
                sendViaSes(emailLog, recipientEmail, subject, bodyHtml, bodyText, ccEmails, bccEmails);
            } else {
                sendViaSmtp(emailLog, recipientEmail, recipientName, subject, bodyHtml, bodyText, ccEmails, bccEmails);
            }

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", recipientEmail, e.getMessage());
            emailLog.markAsFailed(e.getMessage());
        }

        logRepository.save(emailLog);
    }

    private void sendViaSes(EmailLog emailLog, String recipientEmail, String subject,
                            String bodyHtml, String bodyText, String[] ccEmails, String[] bccEmails) {
        // Build destination
        Destination.Builder destinationBuilder = Destination.builder()
                .toAddresses(recipientEmail);

        if (ccEmails != null && ccEmails.length > 0) {
            destinationBuilder.ccAddresses(ccEmails);
        }
        if (bccEmails != null && bccEmails.length > 0) {
            destinationBuilder.bccAddresses(bccEmails);
        }

        // Build email content
        EmailContent.Builder contentBuilder = EmailContent.builder();

        Body.Builder bodyBuilder = Body.builder();
        bodyBuilder.html(Content.builder().data(bodyHtml).charset("UTF-8").build());
        if (bodyText != null) {
            bodyBuilder.text(Content.builder().data(bodyText).charset("UTF-8").build());
        }

        Message message = Message.builder()
                .subject(Content.builder().data(subject).charset("UTF-8").build())
                .body(bodyBuilder.build())
                .build();

        contentBuilder.simple(message);

        // Send email
        SendEmailRequest request = SendEmailRequest.builder()
                .fromEmailAddress(String.format("%s <%s>", fromName, fromAddress))
                .destination(destinationBuilder.build())
                .content(contentBuilder.build())
                .build();

        SendEmailResponse response = sesClient.sendEmail(request);
        emailLog.markAsSent(response.messageId());
        log.info("Email sent successfully via SES to {} - MessageId: {}", recipientEmail, response.messageId());
    }

    private void sendViaSmtp(EmailLog emailLog, String recipientEmail, String recipientName,
                             String subject, String bodyHtml, String bodyText, String[] ccEmails, String[] bccEmails) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromAddress, fromName);
        helper.setTo(recipientEmail);
        if (recipientName != null) {
            // helper.setTo(new InternetAddress(recipientEmail, recipientName));
        }
        helper.setSubject(subject);
        helper.setText(bodyHtml, true);
        if (bodyText != null) {
            // helper.setText(bodyText);
        }

        if (ccEmails != null && ccEmails.length > 0) {
            helper.setCc(ccEmails);
        }
        if (bccEmails != null && bccEmails.length > 0) {
            helper.setBcc(bccEmails);
        }

        mailSender.send(message);
        emailLog.markAsSent("SMTP-" + UUID.randomUUID());
        log.info("Email sent successfully via SMTP to {}", recipientEmail);
    }

    /**
     * Reenvia email falho.
     */
    public void retryEmail(UUID tenantId, UUID emailLogId) {
        EmailLog emailLog = logRepository.findByTenantIdAndId(tenantId, emailLogId)
                .orElseThrow(() -> new IllegalArgumentException("Email log não encontrado"));

        if (emailLog.getRetryCount() >= 3) {
            throw new IllegalStateException("Número máximo de tentativas atingido");
        }

        sendEmail(tenantId, emailLog.getRecipientEmail(), emailLog.getRecipientName(),
                emailLog.getSubject(), emailLog.getBodyHtml(), emailLog.getBodyText(),
                emailLog.getTemplate(), emailLog.getCcEmails(), emailLog.getBccEmails());
    }

    /**
     * Lista templates disponíveis.
     */
    public List<EmailTemplate> listTemplates(UUID tenantId) {
        log.info("Buscando templates para tenantId: {} e systemId: {}", tenantId, SYSTEM_TENANT_ID);
        List<EmailTemplate> templates = templateRepository.findByTenantIdOrSystem(tenantId, SYSTEM_TENANT_ID);
        log.info("Encontrados {} templates", templates.size());
        return templates;
    }

    /**
     * Cria ou atualiza template customizado.
     */
    public EmailTemplate saveTemplate(UUID tenantId, EmailTemplate template) {
        template.setTenantId(tenantId);
        template.setSystem(false);
        return templateRepository.save(template);
    }

    /**
     * Busca template por código.
     */
    public EmailTemplate getTemplateByCode(UUID tenantId, String code) {
        String cleanCode = code != null ? code.trim() : null;
        return templateRepository.findByTenantIdAndCode(tenantId, cleanCode)
                .or(() -> templateRepository.findSystemTemplate(SYSTEM_TENANT_ID, cleanCode))
                .orElseThrow(() -> new IllegalArgumentException("Template não encontrado: " + cleanCode));
    }

    /**
     * Gera preview do template com as variáveis.
     */
    public Map<String, String> previewTemplate(UUID tenantId, String code, Map<String, String> variables) {
        EmailTemplate template = getTemplateByCode(tenantId, code);
        return Map.of(
            "subject", replaceVariables(template.getSubject(), variables),
            "bodyHtml", replaceVariables(template.getBodyHtml(), variables)
        );
    }

    /**
     * Busca histórico de emails.
     */
    public List<EmailLog> getEmailHistory(UUID tenantId, String recipientEmail) {
        if (recipientEmail != null) {
            return logRepository.findByTenantIdAndRecipientEmail(tenantId, recipientEmail);
        }
        return logRepository.findByTenantId(tenantId);
    }

    private String replaceVariables(String text, Map<String, String> variables) {
        if (text == null || variables == null) return text;

        Matcher matcher = VARIABLE_PATTERN.matcher(text);
        StringBuffer result = new StringBuffer();

        while (matcher.find()) {
            String variableName = matcher.group(1);
            String replacement = variables.getOrDefault(variableName, "");
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);

        return result.toString();
    }

    private EmailTemplate getFallbackTemplate(String code) {
        if ("DIGITAL_HIRING_INVITATION".equals(code)) {
            EmailTemplate t = new EmailTemplate();
            t.setCode(code);
            t.setSubject("Bem-vindo(a) ao time! Finalize sua admissão - {{company_name}}");
            t.setBodyHtml("<!DOCTYPE html><html><body><h1>AxonRH</h1><h2>Olá {{candidate_name}},</h2><p>Parabéns por fazer parte da <strong>{{company_name}}</strong>!</p><p>Para darmos continuidade à sua contratação, acesse o link: <a href=\"{{hiring_link}}\">Iniciar Minha Admissão</a></p></body></html>");
            return t;
        }
        return null;
    }
}
