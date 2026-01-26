package com.axonrh.learning.repository;

import com.axonrh.learning.entity.Course;
import com.axonrh.learning.entity.enums.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

    Optional<Course> findByTenantIdAndId(UUID tenantId, UUID id);

    Page<Course> findByTenantId(UUID tenantId, Pageable pageable);

    List<Course> findByTenantIdAndStatus(UUID tenantId, CourseStatus status);

    List<Course> findByTenantIdAndCategoryId(UUID tenantId, UUID categoryId);

    List<Course> findByTenantIdAndIsMandatoryTrue(UUID tenantId);

    @Query("SELECT c FROM Course c WHERE c.tenantId = :tenantId " +
           "AND c.status = 'PUBLISHED' " +
           "AND LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Course> searchByTitle(@Param("tenantId") UUID tenantId,
                               @Param("query") String query,
                               Pageable pageable);

    @Query("SELECT COUNT(c) FROM Course c WHERE c.tenantId = :tenantId AND c.status = :status")
    long countByTenantAndStatus(@Param("tenantId") UUID tenantId, @Param("status") CourseStatus status);
}
