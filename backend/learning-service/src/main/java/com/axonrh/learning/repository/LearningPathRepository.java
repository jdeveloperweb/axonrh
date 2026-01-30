package com.axonrh.learning.repository;

import com.axonrh.learning.entity.LearningPath;
import com.axonrh.learning.entity.enums.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, UUID> {
    Page<LearningPath> findByTenantId(UUID tenantId, Pageable pageable);
    List<LearningPath> findByTenantIdAndStatus(UUID tenantId, CourseStatus status);
}
