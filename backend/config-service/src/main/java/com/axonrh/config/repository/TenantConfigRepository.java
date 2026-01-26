package com.axonrh.config.repository;

import com.axonrh.config.entity.TenantConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio para acesso a configuracoes de tenant.
 */
@Repository
public interface TenantConfigRepository extends JpaRepository<TenantConfig, UUID> {

    /**
     * Busca configuracao ativa por tenant.
     */
    Optional<TenantConfig> findByTenantIdAndIsActiveTrue(UUID tenantId);

    /**
     * Busca configuracao por tenant (qualquer status).
     */
    Optional<TenantConfig> findByTenantId(UUID tenantId);

    /**
     * Verifica se existe configuracao para o tenant.
     */
    boolean existsByTenantId(UUID tenantId);

    /**
     * Busca apenas as cores do tema para cache eficiente.
     */
    @Query("SELECT new map(" +
            "t.primaryColor as primaryColor, " +
            "t.secondaryColor as secondaryColor, " +
            "t.accentColor as accentColor, " +
            "t.backgroundColor as backgroundColor, " +
            "t.surfaceColor as surfaceColor, " +
            "t.textPrimaryColor as textPrimaryColor, " +
            "t.textSecondaryColor as textSecondaryColor, " +
            "t.version as version) " +
            "FROM TenantConfig t WHERE t.tenantId = :tenantId AND t.isActive = true")
    Optional<Object> findThemeColorsByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Busca URL do logo por tenant.
     */
    @Query("SELECT t.logoUrl FROM TenantConfig t WHERE t.tenantId = :tenantId AND t.isActive = true")
    Optional<String> findLogoUrlByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Busca versao atual da configuracao.
     */
    @Query("SELECT t.version FROM TenantConfig t WHERE t.tenantId = :tenantId AND t.isActive = true")
    Optional<Integer> findCurrentVersionByTenantId(@Param("tenantId") UUID tenantId);
}
