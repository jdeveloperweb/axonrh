package com.axonrh.performance.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class TenantFilter extends OncePerRequestFilter {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String tenantId = request.getHeader(TENANT_HEADER);
        
        if (tenantId != null && !tenantId.isEmpty()) {
            try {
                TenantContext.setCurrentTenant(tenantId);
                filterChain.doFilter(request, response);
            } finally {
                TenantContext.clear();
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
}
