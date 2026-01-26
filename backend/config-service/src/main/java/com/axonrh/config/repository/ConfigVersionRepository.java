package com.axonrh.config.repository;

import com.axonrh.config.entity.ConfigVersion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio para acesso a versoes de configuracao.
 */
@Repository
public interface ConfigVersionRepository extends JpaRepository<ConfigVersion, UUID> {

    /**
     * Busca todas as versoes de um tenant ordenadas por versao desc.
     */
    List<ConfigVersion> findByTenantIdOrderByVersionDesc(UUID tenantId);

    /**
     * Busca versoes com paginacao.
     */
    List<ConfigVersion> findByTenantIdOrderByVersionDesc(UUID tenantId, Pageable pageable);

    /**
     * Busca versao especifica.
     */
    Optional<ConfigVersion> findByTenantIdAndVersion(UUID tenantId, Integer version);

    /**
     * Conta total de versoes de um tenant.
     */
    long countByTenantId(UUID tenantId);

    /**
     * Busca a maior versao de um tenant.
     */
    @Query("SELECT MAX(cv.version) FROM ConfigVersion cv WHERE cv.tenantId = :tenantId")
    Optional<Integer> findMaxVersionByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Deleta versoes antigas (mantendo as N mais recentes).
     */
    @Modifying
    @Query("DELETE FROM ConfigVersion cv WHERE cv.tenantId = :tenantId AND cv.version < :minVersion")
    void deleteOldVersions(@Param("tenantId") UUID tenantId, @Param("minVersion") Integer minVersion);

    /**
     * Busca versoes ativas de um tenant.
     */
    List<ConfigVersion> findByTenantIdAndIsActiveTrueOrderByVersionDesc(UUID tenantId);
}
