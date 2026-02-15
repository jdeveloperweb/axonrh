package com.axonrh.performance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class EmployeeDTO {
    private UUID id;
    private UUID tenantId;
    private UUID userId;
    @com.fasterxml.jackson.annotation.JsonProperty("fullName")
    private String fullName;
    private String email;
    private ManagerDTO manager;
    private String positionTitle;
    private String departmentName;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class ManagerDTO {
        private UUID id;
        private UUID userId;
        private String name;
        private String email;
    }
}
