package com.axonrh.payroll.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "config-service", url = "${application.clients.config-service:http://localhost:8888}")
public interface ConfigServiceClient {

    @GetMapping("/api/v1/config/theme/{tenantId}")
    ThemeConfigResponse getThemeConfig(@PathVariable("tenantId") UUID tenantId);

    @GetMapping("/api/v1/config/logo/{tenantId}")
    LogoUrlResponse getLogoUrl(@PathVariable("tenantId") UUID tenantId);

    @Data
    class ThemeConfigResponse {
        private String primaryColor;
        private String secondaryColor;
        private String logoUrl;
    }

    @Data
    class LogoUrlResponse {
        private UUID tenantId;
        private String logoUrl;
    }
}
