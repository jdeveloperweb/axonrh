package com.axonrh.performance.aspect;

import com.axonrh.performance.client.AuditClient;
import com.axonrh.performance.config.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
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

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
    public void restController() {}

    @Pointcut("@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.DeleteMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.PatchMapping)")
    public void mutationMapping() {}

    @AfterReturning(pointcut = "restController() && mutationMapping()", returning = "result")
    public void logMutation(JoinPoint joinPoint, Object result) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return;

            HttpServletRequest request = attributes.getRequest();
            
            String userId = request.getHeader("X-User-Id");
            String userName = request.getHeader("X-User-Name");
            String userEmail = request.getHeader("X-User-Email");
            
            String tenantIdStr = TenantContext.getCurrentTenant();
            UUID tenantId = (tenantIdStr != null && !tenantIdStr.isEmpty()) ? UUID.fromString(tenantIdStr) : null;
            
            AuditClient.AuditRequest auditRequest = AuditClient.AuditRequest.builder()
                    .tenantId(tenantId)
                    .userId(userId != null ? UUID.fromString(userId) : null)
                    .userName(userName)
                    .userEmail(userEmail)
                    .action(request.getMethod())
                    .resource(request.getRequestURI())
                    .ipAddress(request.getRemoteAddr())
                    .userAgent(request.getHeader("User-Agent"))
                    .status("SUCCESS")
                    .details("Action: " + joinPoint.getSignature().getName())
                    .build();

            auditClient.log(auditRequest);
        } catch (Exception e) {
            log.error("Error in AuditAspect: {}", e.getMessage());
        }
    }
}
