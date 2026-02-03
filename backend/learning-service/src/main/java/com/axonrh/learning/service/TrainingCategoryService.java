package com.axonrh.learning.service;

import com.axonrh.learning.entity.Course;
import com.axonrh.learning.entity.TrainingCategory;
import com.axonrh.learning.repository.CourseRepository;
import com.axonrh.learning.repository.TrainingCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TrainingCategoryService {

    private final TrainingCategoryRepository categoryRepository;
    private final CourseRepository courseRepository;

    public TrainingCategoryService(TrainingCategoryRepository categoryRepository, CourseRepository courseRepository) {
        this.categoryRepository = categoryRepository;
        this.courseRepository = courseRepository;
    }

    public TrainingCategory create(UUID tenantId, TrainingCategory category) {
        category.setTenantId(tenantId);
        return categoryRepository.save(category);
    }

    public TrainingCategory update(UUID tenantId, UUID id, TrainingCategory updated) {
        TrainingCategory existing = get(tenantId, id);
        
        // Removida restrição de categorias globais para permitir ajustes rápidos (ser prático)
        // No futuro, implementar cópia por tenant se necessário.

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
                .filter(c -> c.getTenantId().equals(tenantId) || c.getTenantId().equals(UUID.fromString("00000000-0000-0000-0000-000000000000")))
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
        
        List<Course> courses = courseRepository.findByCategoryId(id);
        if (!courses.isEmpty()) {
            String titles = courses.stream()
                .map(c -> c.getTitle() + " (" + c.getStatus() + ")")
                .collect(java.util.stream.Collectors.joining(", "));
            throw new RuntimeException("Esta categoria não pode ser excluída pois existem cursos vinculados a ela: " + titles);
        }

        categoryRepository.delete(category);
    }
}
