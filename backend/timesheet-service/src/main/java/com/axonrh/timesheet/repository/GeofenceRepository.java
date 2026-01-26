package com.axonrh.timesheet.repository;

import com.axonrh.timesheet.entity.Geofence;
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
public interface GeofenceRepository extends JpaRepository<Geofence, UUID> {

    // Busca por tenant e ID
    Optional<Geofence> findByTenantIdAndId(UUID tenantId, UUID id);

    // Lista todas as geofences ativas
    List<Geofence> findByTenantIdAndActiveTrue(UUID tenantId);

    // Lista paginada
    Page<Geofence> findByTenantIdOrderByNameAsc(UUID tenantId, Pageable pageable);

    // Busca por nome
    Optional<Geofence> findByTenantIdAndName(UUID tenantId, String name);

    // Busca por tipo de local
    List<Geofence> findByTenantIdAndLocationTypeAndActiveTrue(UUID tenantId, String locationType);

    // Geofences proximas de uma coordenada (para validacao)
    @Query(value = """
        SELECT * FROM geofences g
        WHERE g.tenant_id = :tenantId
        AND g.active = true
        AND (
            6371000 * acos(
                cos(radians(:latitude)) * cos(radians(g.latitude)) *
                cos(radians(g.longitude) - radians(:longitude)) +
                sin(radians(:latitude)) * sin(radians(g.latitude))
            )
        ) <= g.radius_meters
        """, nativeQuery = true)
    List<Geofence> findContainingPoint(
            @Param("tenantId") UUID tenantId,
            @Param("latitude") double latitude,
            @Param("longitude") double longitude);

    // Geofences para um departamento
    @Query("""
        SELECT g FROM Geofence g
        WHERE g.tenantId = :tenantId
        AND g.active = true
        AND (g.departmentIds IS NULL OR g.departmentIds LIKE %:departmentId%)
        """)
    List<Geofence> findForDepartment(
            @Param("tenantId") UUID tenantId,
            @Param("departmentId") String departmentId);

    // Geofences para um colaborador especifico
    @Query("""
        SELECT g FROM Geofence g
        WHERE g.tenantId = :tenantId
        AND g.active = true
        AND (g.employeeIds IS NULL OR g.employeeIds LIKE %:employeeId%)
        """)
    List<Geofence> findForEmployee(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") String employeeId);

    // Contagem de geofences ativas
    long countByTenantIdAndActiveTrue(UUID tenantId);

    // Verifica se nome ja existe
    boolean existsByTenantIdAndNameAndIdNot(UUID tenantId, String name, UUID id);

    // Busca por SSID de WiFi
    Optional<Geofence> findByTenantIdAndWifiSsidAndActiveTrue(UUID tenantId, String wifiSsid);
}
