package com.axonrh.learning.service;

import com.axonrh.learning.entity.TrainingCategory;
import com.axonrh.learning.repository.TrainingCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TrainingCategoryService {

    private final TrainingCategoryRepository categoryRepository;

    public TrainingCategoryService(TrainingCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public TrainingCategory create(UUID tenantId, TrainingCategory category) {
        category.setTenantId(tenantId);
        return categoryRepository.save(category);
    }

    public TrainingCategory update(UUID tenantId, UUID id, TrainingCategory updated) {
        TrainingCategory existing = get(tenantId, id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setIcon(updated.getIcon());
        existing.setColor(updated.getColor());
        existing.setParentId(updated.getParentId());
        existing.setActive(updated.isActive());
        return categoryRepository.save(existing);
    }

    public TrainingCategory get(UUID tenantId, UUID id) {
        return categoryRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Category not found or access denied"));
    }

    public List<TrainingCategory> list(UUID tenantId) {
        List<TrainingCategory> all = categoryRepository.findByTenantId(tenantId);
        // De-duplicate by name, prioritizing current tenant
        java.util.Map<String, TrainingCategory> distinct = new java.util.LinkedHashMap<>();
        for (TrainingCategory cat : all) {
            boolean isGlobal = cat.getTenantId().equals(UUID.fromString("00000000-0000-0000-0000-000000000000"));
            String key = cat.getName().toLowerCase();
            if (!distinct.containsKey(key) || !isGlobal) {
                distinct.put(key, cat);
            }
        }
        return new java.util.ArrayList<>(distinct.values());
    }

    public void delete(UUID tenantId, UUID id) {
        TrainingCategory category = get(tenantId, id);
        categoryRepository.delete(category);
    }
}
