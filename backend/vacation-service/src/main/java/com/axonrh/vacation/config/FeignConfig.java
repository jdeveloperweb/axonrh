package com.axonrh.vacation.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            // Propagar Tenant ID
            String tenantId = TenantContext.getCurrentTenant();
            if (tenantId != null) {
                requestTemplate.header("X-Tenant-Id", tenantId);
            }
            
            // Propagar Token JWT (Authorization)
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication instanceof JwtAuthenticationToken jwtToken) {
                requestTemplate.header("Authorization", "Bearer " + jwtToken.getToken().getTokenValue());
            }
        };
    }
}
