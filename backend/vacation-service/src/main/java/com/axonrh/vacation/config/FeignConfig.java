package com.axonrh.vacation.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            String tenantId = TenantContext.getCurrentTenant();
            if (tenantId != null) {
                requestTemplate.header("X-Tenant-Id", tenantId);
            }
            
            // Também passar header de usuário se disponível
            // Isso pode ser útil para auditoria em outros serviços
        };
    }
}
