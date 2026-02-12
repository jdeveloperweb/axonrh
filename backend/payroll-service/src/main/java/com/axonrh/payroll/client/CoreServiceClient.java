package com.axonrh.payroll.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "core-service", url = "${application.clients.core-service:http://localhost:8081}")
public interface CoreServiceClient {

    @GetMapping("/api/v1/setup/company")
    CompanyProfileDTO getCompanyProfile(@RequestHeader("X-Tenant-ID") UUID tenantId);

    @Data
    class CompanyProfileDTO {
        private String legalName;
        private String tradeName;
        private String cnpj;
    }
}
