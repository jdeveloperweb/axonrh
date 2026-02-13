package com.axonrh.integration.dynamic.repository;

import com.axonrh.integration.dynamic.entity.IntegrationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface IntegrationLogRepository extends JpaRepository<IntegrationLog, UUID> {
}
