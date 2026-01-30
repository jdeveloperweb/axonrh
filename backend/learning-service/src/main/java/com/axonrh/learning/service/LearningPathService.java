package com.axonrh.learning.service;

import com.axonrh.learning.entity.LearningPath;
import com.axonrh.learning.entity.enums.CourseStatus;
import com.axonrh.learning.repository.LearningPathRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class LearningPathService {

    private final LearningPathRepository pathRepository;

    public LearningPathService(LearningPathRepository pathRepository) {
        this.pathRepository = pathRepository;
    }

    public LearningPath create(UUID tenantId, LearningPath path) {
        path.setTenantId(tenantId);
        return pathRepository.save(path);
    }

    public LearningPath get(UUID tenantId, UUID id) {
        return pathRepository.findById(id)
                .filter(p -> p.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Learning Path not found"));
    }

    public Page<LearningPath> list(UUID tenantId, Pageable pageable) {
        return pathRepository.findByTenantId(tenantId, pageable);
    }

    public List<LearningPath> listPublished(UUID tenantId) {
        return pathRepository.findByTenantIdAndStatus(tenantId, CourseStatus.PUBLISHED);
    }

    public LearningPath publish(UUID tenantId, UUID id) {
        LearningPath path = get(tenantId, id);
        path.setStatus(CourseStatus.PUBLISHED);
        return pathRepository.save(path);
    }
}
