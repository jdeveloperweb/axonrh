package com.axonrh.employee.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro para extrair tenant ID do header ou JWT.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class TenantFilter extends OncePerRequestFilter {

    private static final String TENANT_HEADER = "X-Tenant-Id";
    private static final String TENANT_HEADER_ALT = "X-Tenant-ID";
    private static final String CORRELATION_HEADER = "X-Correlation-ID";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            log.debug(">>> [DEBUG-TRACE] Request arriving: {} {}", request.getMethod(), request.getRequestURI());
            // Extrai tenant do header (tenta ambos os formatos)
            String tenantId = request.getHeader(TENANT_HEADER);
            if (tenantId == null || tenantId.isBlank()) {
                tenantId = request.getHeader(TENANT_HEADER_ALT);
            }

            if (tenantId != null && !tenantId.isBlank()) {
                log.debug("Tenant ID encontrado no header {}: {}", TENANT_HEADER, tenantId);
                TenantContext.setCurrentTenant(tenantId);
                MDC.put("tenantId", tenantId);
            } else {
                log.warn("Aviso: Header {} nao encontrado no request para {}", TENANT_HEADER, request.getRequestURI());
            }

            // [DEBUG] Inspect Authorization Header
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                log.info(">>> [DEBUG-TRACE] Token found in TenantFilter");
                try {
                    String token = authHeader.substring(7);
                    String[] parts = token.split("\\.");
                    if (parts.length > 0) {
                        String headerJson = new String(java.util.Base64.getUrlDecoder().decode(parts[0]));
                        log.info(">>> [DEBUG-TRACE] JWT Header: " + headerJson);
                    }
                } catch (Exception e) {
                    log.error(">>> [DEBUG-TRACE] Failed to decode JWT header: " + e.getMessage());
                }
            } else {
                log.info(">>> [DEBUG-TRACE] No Authorization header found in TenantFilter");
            }

            // Extrai correlation ID para tracing
            String correlationId = request.getHeader(CORRELATION_HEADER);
            if (correlationId != null && !correlationId.isBlank()) {
                MDC.put("correlationId", correlationId);
            }

            try {
                filterChain.doFilter(request, response);
                log.debug("<<< [DEBUG-TRACE] Request finished: {} {} -> Status {}", 
                    request.getMethod(), request.getRequestURI(), response.getStatus());
            } catch (Exception e) {
                log.error("!!! [DEBUG-TRACE] Error in TenantFilter: {}", e.getMessage(), e);
                throw e;
            }

        } finally {
            TenantContext.clear();
            MDC.clear();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Nao filtra endpoints de health e actuator
        return path.startsWith("/actuator") || path.startsWith("/health");
    }
}
