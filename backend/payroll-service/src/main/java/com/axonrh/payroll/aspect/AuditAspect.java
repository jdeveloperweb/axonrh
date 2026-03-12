package com.axonrh.payroll.aspect;

import com.axonrh.payroll.client.AuditClient;
import com.axonrh.payroll.config.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditClient auditClient;

    @Pointcut("@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.DeleteMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.PatchMapping)")
    public void mutationEndpoints() {}

    @Pointcut("within(com.axonrh.payroll.controller..*)")
    public void controllerClasses() {}

    @AfterReturning(pointcut = "controllerClasses() && mutationEndpoints()", returning = "result")
    public void auditLog(JoinPoint joinPoint, Object result) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
                return;
            }

            Jwt jwt = (Jwt) auth.getPrincipal();
            UUID userId = UUID.fromString(jwt.getSubject());
            String userName = jwt.getClaimAsString("name");
            String userEmail = jwt.getClaimAsString("email");
            
            // Tenta pegar o tenant do header ou do context
            UUID tenantId = TenantContext.getCurrentTenant();

            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String method = request.getMethod();
            String path = request.getRequestURI();
            String ipAddress = request.getRemoteAddr();
            String userAgent = request.getHeader("User-Agent");

            String action = mapMethodToAction(method);
            String resource = extractResourceFromPath(path);
            
            // Tenta extrair ID do recurso dos argumentos do método
            String resourceId = null;
            Object[] args = joinPoint.getArgs();
            for (Object arg : args) {
                if (arg instanceof UUID) {
                    resourceId = arg.toString();
                    break;
                }
            }

            auditClient.log(AuditClient.AuditRequest.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .userName(userName)
                    .userEmail(userEmail)
                    .action(action)
                    .resource(resource)
                    .resourceId(resourceId)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .status("SUCCESS")
                    .details("Executed " + method + " on " + path)
                    .build());
            
        } catch (Exception e) {
            log.error("Error creating audit log in Payroll Aspect: {}", e.getMessage());
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
                return parts[i+1].toUpperCase();
            }
        }
        return "UNKNOWN";
    }
}
