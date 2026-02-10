package com.axonrh.auth.service;

import com.axonrh.auth.dto.PermissionDTO;
import com.axonrh.auth.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<PermissionDTO> findAll() {
        return permissionRepository.findAllByOrderByModuleAscResourceAscActionAsc().stream()
                .map(p -> new PermissionDTO(
                        p.getId(),
                        p.getResource(),
                        p.getAction(),
                        p.getDisplayName(),
                        p.getDescription(),
                        p.getModule(),
                        p.getCode(),
                        p.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, List<PermissionDTO>> findAllGroupedByModule() {
        return findAll().stream()
                .collect(Collectors.groupingBy(PermissionDTO::getModule));
    }
}
