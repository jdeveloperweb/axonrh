package com.axonrh.timesheet.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "core-service", url = "${application.clients.core-service:http://core-service:8080}")
public interface CoreServiceClient {

    @GetMapping("/api/v1/setup/company")
    CompanyProfileDTO getCompanyProfile(@RequestHeader("X-Tenant-ID") UUID tenantId);

    @GetMapping("/api/v1/setup/work-schedules/{id}")
    com.axonrh.timesheet.entity.WorkSchedule getWorkScheduleWithDays(@RequestHeader("X-Tenant-ID") UUID tenantId, @RequestHeader("id") UUID id);

    @lombok.Data
    class CompanyProfileDTO {
        private String legalName;
        private String tradeName;
        private String cnpj;
        private String addressStreet;
        private String addressNumber;
        private String addressComplement;
        private String addressNeighborhood;
        private String addressCity;
        private String addressState;
        private String addressZipCode;

        public String getFullAddress() {
            StringBuilder sb = new StringBuilder();
            if (addressStreet != null) sb.append(addressStreet);
            if (addressNumber != null) sb.append(", ").append(addressNumber);
            if (addressComplement != null) sb.append(" - ").append(addressComplement);
            if (addressNeighborhood != null) sb.append(", ").append(addressNeighborhood);
            if (addressCity != null) sb.append(" - ").append(addressCity);
            if (addressState != null) sb.append("/").append(addressState);
            if (addressZipCode != null) sb.append(" - CEP: ").append(addressZipCode);
            return sb.toString();
        }
    }
}
