package com.axonrh.auth.repository;

import com.axonrh.auth.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    List<Permission> findAllByOrderByModuleAscResourceAscActionAsc();
    List<Permission> findByModule(String module);
}
