package com.axonrh.notification.repository;

import com.axonrh.notification.entity.PushLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PushLogRepository extends JpaRepository<PushLog, UUID> {
    // Push log operations can be added as needed
}
