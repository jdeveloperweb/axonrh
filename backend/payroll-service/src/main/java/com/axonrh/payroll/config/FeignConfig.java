package com.axonrh.payroll.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor tenantHeaderInterceptor() {
        return requestTemplate -> {
            String tenantId = TenantContext.getCurrentTenant();
            if (tenantId != null) {
                requestTemplate.header("X-Tenant-Id", tenantId);
            }
        };
    }
}
