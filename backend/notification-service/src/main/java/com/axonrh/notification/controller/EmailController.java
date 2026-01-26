package com.axonrh.notification.controller;

import com.axonrh.notification.entity.EmailLog;
import com.axonrh.notification.entity.EmailTemplate;
import com.axonrh.notification.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications/email")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/send")
    public ResponseEntity<Void> sendEmail(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody SendEmailRequest request) {

        if (request.templateCode() != null) {
            emailService.sendTemplateEmail(
                    tenantId,
                    request.templateCode(),
                    request.recipientEmail(),
                    request.recipientName(),
                    request.variables()
            );
        } else {
            emailService.sendCustomEmail(
                    tenantId,
                    request.recipientEmail(),
                    request.recipientName(),
                    request.subject(),
                    request.bodyHtml(),
                    request.bodyText()
            );
        }
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/{emailLogId}/retry")
    public ResponseEntity<Void> retryEmail(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID emailLogId) {

        emailService.retryEmail(tenantId, emailLogId);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/templates")
    public ResponseEntity<List<EmailTemplate>> listTemplates(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {

        return ResponseEntity.ok(emailService.listTemplates(tenantId));
    }

    @PostMapping("/templates")
    public ResponseEntity<EmailTemplate> createTemplate(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody EmailTemplate template) {

        return ResponseEntity.ok(emailService.saveTemplate(tenantId, template));
    }

    @GetMapping("/history")
    public ResponseEntity<List<EmailLog>> getEmailHistory(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(required = false) String recipientEmail) {

        return ResponseEntity.ok(emailService.getEmailHistory(tenantId, recipientEmail));
    }

    public record SendEmailRequest(
            String templateCode,
            String recipientEmail,
            String recipientName,
            String subject,
            String bodyHtml,
            String bodyText,
            Map<String, String> variables
    ) {}
}
