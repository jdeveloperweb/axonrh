package com.axonrh.performance.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                String tenantId = TenantContext.getCurrentTenant();
                if (tenantId != null && !tenantId.isEmpty()) {
                    template.header(TENANT_HEADER, tenantId);
                }
            }
        };
    }
}
