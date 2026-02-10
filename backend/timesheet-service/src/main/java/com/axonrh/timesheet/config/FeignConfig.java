package com.axonrh.timesheet.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Configuration
public class FeignConfig {

    private static final String TENANT_HEADER = "X-Tenant-ID";
    private static final String AUTHORIZATION_HEADER = "Authorization";

    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                // Propaga Tenant ID
                String tenantId = TenantContext.getCurrentTenant();
                if (tenantId != null && !tenantId.isEmpty()) {
                    template.header(TENANT_HEADER, tenantId);
                }

                // Propaga Token de Autenticação
                ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                if (attributes != null) {
                    HttpServletRequest request = attributes.getRequest();
                    String authHeader = request.getHeader(AUTHORIZATION_HEADER);
                    if (authHeader != null && !authHeader.isEmpty()) {
                        template.header(AUTHORIZATION_HEADER, authHeader);
                    }
                }
            }
        };
    }
}
