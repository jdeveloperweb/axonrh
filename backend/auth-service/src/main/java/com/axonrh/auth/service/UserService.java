package com.axonrh.auth.service;

import com.axonrh.auth.entity.Role;
import com.axonrh.auth.entity.User;
import com.axonrh.auth.repository.RoleRepository;
import com.axonrh.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> listUsersByTenant(UUID tenantId) {
        log.info("Listing users for tenant: {}", tenantId);
        List<User> users = userRepository.findAllByTenantId(tenantId);
        log.info("Found {} users for tenant {}", users.size(), tenantId);
        return users;
    }

    @Transactional
    public User createUser(User user, Set<String> roleNames) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("E-mail já cadastrado");
        }

        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        if (user.getStatus() == null) {
            user.setStatus(User.UserStatus.ACTIVE);
        }

        Set<Role> roles = roleNames.stream()
                .map(name -> roleRepository.findByName(name)
                        .orElseThrow(() -> {
                            log.error("Role not found: {}", name);
                            return new RuntimeException("Role não encontrada: " + name);
                        }))
                .collect(Collectors.toSet());
        
        user.setRoles(roles);
        
        log.info("Creating new user: {}", user.getEmail());
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(UUID id, User userData, Set<String> roleNames) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        user.setName(userData.getName());
        user.setAvatarUrl(userData.getAvatarUrl());
        user.setStatus(userData.getStatus());

        if (userData.getPasswordHash() != null && !userData.getPasswordHash().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(userData.getPasswordHash()));
        }

        if (roleNames != null && !roleNames.isEmpty()) {
            Set<Role> roles = roleNames.stream()
                    .map(name -> roleRepository.findByName(name)
                            .orElseThrow(() -> new RuntimeException("Role não encontrada: " + name)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }
}
