package com.axonrh.learning.service;

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
        
        // Impedir edição de categorias globais por tenants específicos
        if (existing.getTenantId().equals(UUID.fromString("00000000-0000-0000-0000-000000000000")) &&
            !tenantId.equals(UUID.fromString("00000000-0000-0000-0000-000000000000"))) {
            
            // Em vez de falhar, se o usuário tentar editar uma global, poderíamos criar uma cópia para o tenant
            // Mas por enquanto, vamos apenas avisar ou permitir se ele quiser "sobrescrever" (embora perigoso)
            // Para ser prático e fazer "funcionar", vou permitir se for o mesmo nome? Não.
            throw new RuntimeException("Categorias globais não podem ser editadas por empresas. Crie uma nova categoria.");
        }

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
        
        if (category.getTenantId().equals(UUID.fromString("00000000-0000-0000-0000-000000000000")) &&
            !tenantId.equals(UUID.fromString("00000000-0000-0000-0000-000000000000"))) {
            throw new RuntimeException("Categorias globais não podem ser excluídas por empresas.");
        }

        if (courseRepository.existsByCategoryId(id)) {
            throw new RuntimeException("Esta categoria não pode ser excluída pois existem cursos vinculados a ela.");
        }

        categoryRepository.delete(category);
    }
}
