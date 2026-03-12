package com.axonrh.auth.aspect;

import com.axonrh.auth.entity.AuditLog;
import com.axonrh.auth.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditService auditService;

    @Pointcut("@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.DeleteMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.PatchMapping)")
    public void mutationEndpoints() {}

    @Pointcut("within(com.axonrh.auth.controller..*)")
    public void controllerClasses() {}

    @AfterReturning(pointcut = "controllerClasses() && mutationEndpoints()", returning = "result")
    public void auditLog(JoinPoint joinPoint, Object result) {
        try {
            // Se for o log de auditoria, não loga novamente (evita loop)
            if (joinPoint.getSignature().getDeclaringTypeName().contains("AuditController")) {
                return;
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            // No auth-service, o principal pode ser o User object se já estiver autenticado
            // ou uma string se for o Gateway
            if (auth == null) {
                return;
            }

            UUID userId = null;
            String userName = "System";
            String userEmail = "system@axonrh.com";
            UUID tenantId = null;

            // Tenta extrair informações do usuário se disponível
            Object principal = auth.getPrincipal();
            if (principal instanceof com.axonrh.auth.entity.User) {
                com.axonrh.auth.entity.User user = (com.axonrh.auth.entity.User) principal;
                userId = user.getId();
                userName = user.getName();
                userEmail = user.getEmail();
                tenantId = user.getTenantId();
            } else if (auth.getDetails() instanceof java.util.Map) {
                // Se vier do Gateway via JwtAuthFilter (que preenche o context)
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> details = (java.util.Map<String, Object>) auth.getDetails();
                userId = (UUID) details.get("user_id");
                userEmail = (String) details.get("email");
                tenantId = (UUID) details.get("tenant_id");
            }

            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String method = request.getMethod();
            String path = request.getRequestURI();
            String ipAddress = request.getRemoteAddr();

            String action = mapMethodToAction(method);
            String resource = extractResourceFromPath(path);
            
            String resourceId = null;
            Object[] args = joinPoint.getArgs();
            for (Object arg : args) {
                if (arg instanceof UUID) {
                    resourceId = arg.toString();
                    break;
                }
            }

            auditService.log(AuditLog.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .userName(userName)
                    .userEmail(userEmail)
                    .action(action)
                    .resource(resource)
                    .resourceId(resourceId)
                    .ipAddress(ipAddress)
                    .details("Executed " + method + " on " + path)
                    .status("SUCCESS")
                    .build());
            
        } catch (Exception e) {
            log.error("Error creating audit log in Auth Aspect: {}", e.getMessage());
        }
    }

    private String mapMethodToAction(String method) {
        return switch (method) {
            case "POST" -> "CREATE";
            case "PUT", "PATCH" -> "UPDATE";
            case "DELETE" -> "DELETE";
            default -> "OTHER";
        };
    }

    private String extractResourceFromPath(String path) {
        String[] parts = path.split("/");
        for (int i = 0; i < parts.length; i++) {
            if (parts[i].equals("v1") && i + 1 < parts.length) {
                return parts[i+1].toUpperCase().replaceAll("S$", "");
            }
        }
        return "UNKNOWN";
    }
}
