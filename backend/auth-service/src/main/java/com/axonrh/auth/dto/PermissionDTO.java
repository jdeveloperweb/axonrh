package com.axonrh.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionDTO {
    private UUID id;
    private String resource;
    private String action;
    private String displayName;
    private String description;
    private String module;
    private String code; // resource:action
    private LocalDateTime createdAt;
}
