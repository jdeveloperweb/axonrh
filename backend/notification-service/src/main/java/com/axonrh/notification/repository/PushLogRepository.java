package com.axonrh.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PushLogRepository extends JpaRepository<Object, UUID> {
    // Push log operations can be added as needed
    // This is a placeholder for push notification logging
}
