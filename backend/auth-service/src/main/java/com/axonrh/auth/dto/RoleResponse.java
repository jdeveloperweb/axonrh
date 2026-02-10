package com.axonrh.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {
    private UUID id;
    private String name;
    private String description;
    private boolean systemRole;
    private int hierarchyLevel;
    private boolean active;
    private List<PermissionDTO> permissions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
