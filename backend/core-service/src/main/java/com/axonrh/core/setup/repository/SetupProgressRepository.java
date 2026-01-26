package com.axonrh.core.setup.repository;

import com.axonrh.core.setup.entity.SetupProgress;
import com.axonrh.core.setup.entity.SetupProgress.SetupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SetupProgressRepository extends JpaRepository<SetupProgress, UUID> {

    Optional<SetupProgress> findByTenantId(UUID tenantId);

    List<SetupProgress> findByStatus(SetupStatus status);

    @Query("SELECT s FROM SetupProgress s WHERE s.status = 'IN_PROGRESS' " +
           "AND s.lastActivityAt < :cutoffDate")
    List<SetupProgress> findInactiveSetups(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);

    @Query("SELECT s.status, COUNT(s) FROM SetupProgress s GROUP BY s.status")
    List<Object[]> countByStatus();

    boolean existsByTenantIdAndStatus(UUID tenantId, SetupStatus status);
}
