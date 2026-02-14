package com.axonrh.timesheet.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "config-service", url = "${application.clients.config-service:http://localhost:8888}")
public interface ConfigServiceClient {

    @GetMapping("/api/v1/config/theme/{tenantId}")
    ThemeConfigResponse getThemeConfig(@PathVariable("tenantId") UUID tenantId);

    @GetMapping("/api/v1/config/logos/{tenantId}/{filename}")
    byte[] getLogoBytes(@PathVariable("tenantId") UUID tenantId, @PathVariable("filename") String filename);

    @lombok.Data
    class ThemeConfigResponse {
        private String logoUrl;
        private String primaryColor;
        private String secondaryColor;
    }
}
