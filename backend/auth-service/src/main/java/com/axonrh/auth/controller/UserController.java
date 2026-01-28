package com.axonrh.auth.controller;

import com.axonrh.auth.dto.UserDTO;
import com.axonrh.auth.entity.User;
import com.axonrh.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Usuários", description = "Gestão de usuários do sistema")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Listar usuários", description = "Lista todos os usuários do tenant atual")
    public ResponseEntity<List<UserDTO>> listUsers(@RequestHeader("X-Tenant-Id") String tenantId) {
        List<User> users = userService.listUsersByTenant(UUID.fromString(tenantId));
        return ResponseEntity.ok(users.stream().map(this::toDTO).collect(Collectors.toList()));
    }

    @PostMapping
    @Operation(summary = "Criar usuário", description = "Cria um novo usuário para o tenant")
    public ResponseEntity<UserDTO> createUser(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody UserDTO dto) {
        
        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .passwordHash(dto.getPassword())
                .tenantId(UUID.fromString(tenantId))
                .avatarUrl(dto.getAvatarUrl())
                .build();
        
        User saved = userService.createUser(user, Set.copyOf(dto.getRoles()));
        return ResponseEntity.ok(toDTO(saved));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar usuário", description = "Atualiza dados de um usuário existente")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable UUID id,
            @RequestBody UserDTO dto) {
        
        User user = User.builder()
                .name(dto.getName())
                .avatarUrl(dto.getAvatarUrl())
                .status(dto.getStatus() != null ? User.UserStatus.valueOf(dto.getStatus()) : null)
                .passwordHash(dto.getPassword())
                .build();
        
        User updated = userService.updateUser(id, user, dto.getRoles() != null ? Set.copyOf(dto.getRoles()) : null);
        return ResponseEntity.ok(toDTO(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir usuário", description = "Remove um usuário do sistema")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(toDTO(userService.getUserById(id)));
    }

    private UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .avatarUrl(user.getAvatarUrl())
                .tenantId(user.getTenantId())
                .roles(user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toList()))
                .build();
    }
}
