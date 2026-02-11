package com.axonrh.timesheet.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "config-service", url = "${application.clients.config-service:http://config-service:8888}")
public interface ConfigServiceClient {

    @GetMapping("/api/v1/config/logo/{tenantId}")
    LogoUrlResponse getLogoUrl(@PathVariable("tenantId") UUID tenantId);

    record LogoUrlResponse(UUID tenantId, String logoUrl) {}
}
