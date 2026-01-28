package com.axonrh.core.setup.entity.auth;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "roles", schema = "shared")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    private UUID id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "is_system_role")
    private boolean systemRole;
}
