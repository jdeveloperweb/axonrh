package com.axonrh.timesheet.service;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.dto.GeofenceRequest;
import com.axonrh.timesheet.dto.GeofenceResponse;
import com.axonrh.timesheet.entity.Geofence;
import com.axonrh.timesheet.exception.DuplicateResourceException;
import com.axonrh.timesheet.exception.ResourceNotFoundException;
import com.axonrh.timesheet.repository.GeofenceRepository;
import com.axonrh.timesheet.service.TimeRecordService.GeofenceValidationResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * T134 - Servico de geofencing.
 */
@Slf4j
@Service
public class GeofenceService {

    private final GeofenceRepository geofenceRepository;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    public GeofenceService(
            GeofenceRepository geofenceRepository,
            @Qualifier("timesheetKafkaObjectMapper") ObjectMapper objectMapper,
            JdbcTemplate jdbcTemplate) {
        this.geofenceRepository = geofenceRepository;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Cria uma nova geofence.
     */
    @Transactional
    @CacheEvict(value = "geofences", allEntries = true)
    public GeofenceResponse createGeofence(GeofenceRequest request, UUID userId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        // Verificar nome duplicado
        if (geofenceRepository.findByTenantIdAndName(tenantId, request.getName()).isPresent()) {
            throw new DuplicateResourceException("Ja existe uma geofence com este nome");
        }

        Geofence geofence = Geofence.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .radiusMeters(request.getRadiusMeters() != null ? request.getRadiusMeters() : 100)
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .zipCode(request.getZipCode())
                .locationType(request.getLocationType())
                .departmentIds(toJson(request.getDepartmentIds()))
                .employeeIds(toJson(request.getEmployeeIds()))
                .requireWifi(request.getRequireWifi() != null ? request.getRequireWifi() : false)
                .wifiSsid(request.getWifiSsid())
                .wifiBssid(request.getWifiBssid())
                .active(request.getActive() != null ? request.getActive() : true)
                .createdBy(userId)
                .build();

        Geofence saved = geofenceRepository.save(geofence);
        log.info("Geofence criada - id: {}, nome: {}", saved.getId(), saved.getName());

        return toResponse(saved);
    }

    /**
     * Atualiza uma geofence.
     */
    @Transactional
    @CacheEvict(value = "geofences", allEntries = true)
    public GeofenceResponse updateGeofence(UUID id, GeofenceRequest request, UUID userId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        Geofence geofence = geofenceRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Geofence nao encontrada"));

        // Verificar nome duplicado
        if (geofenceRepository.existsByTenantIdAndNameAndIdNot(tenantId, request.getName(), id)) {
            throw new DuplicateResourceException("Ja existe uma geofence com este nome");
        }

        geofence.setName(request.getName());
        geofence.setDescription(request.getDescription());
        geofence.setLatitude(request.getLatitude());
        geofence.setLongitude(request.getLongitude());
        if (request.getRadiusMeters() != null) {
            geofence.setRadiusMeters(request.getRadiusMeters());
        }
        geofence.setAddress(request.getAddress());
        geofence.setCity(request.getCity());
        geofence.setState(request.getState());
        geofence.setZipCode(request.getZipCode());
        geofence.setLocationType(request.getLocationType());
        geofence.setDepartmentIds(toJson(request.getDepartmentIds()));
        geofence.setEmployeeIds(toJson(request.getEmployeeIds()));
        if (request.getRequireWifi() != null) {
            geofence.setRequireWifi(request.getRequireWifi());
        }
        geofence.setWifiSsid(request.getWifiSsid());
        geofence.setWifiBssid(request.getWifiBssid());
        if (request.getActive() != null) {
            geofence.setActive(request.getActive());
        }
        geofence.setUpdatedBy(userId);

        Geofence saved = geofenceRepository.save(geofence);
        log.info("Geofence atualizada - id: {}", id);

        return toResponse(saved);
    }

    /**
     * Busca uma geofence por ID.
     */
    @Transactional(readOnly = true)
    public GeofenceResponse getGeofenceById(UUID id) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        Geofence geofence = geofenceRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Geofence nao encontrada"));

        return toResponse(geofence);
    }

    /**
     * Lista todas as geofences ativas.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "geofences", key = "'active-' + T(com.axonrh.timesheet.config.TenantContext).getCurrentTenant()")
    public List<GeofenceResponse> getActiveGeofences() {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        return geofenceRepository.findByTenantIdAndActiveTrue(tenantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Lista geofences com paginacao.
     */
    @Transactional(readOnly = true)
    public Page<GeofenceResponse> listGeofences(Pageable pageable) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        return geofenceRepository.findByTenantIdOrderByNameAsc(tenantId, pageable)
                .map(this::toResponse);
    }

    /**
     * Exclui uma geofence (soft delete).
     */
    @Transactional
    @CacheEvict(value = "geofences", allEntries = true)
    public void deleteGeofence(UUID id, UUID userId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        Geofence geofence = geofenceRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Geofence nao encontrada"));

        geofence.setActive(false);
        geofence.setUpdatedBy(userId);
        geofenceRepository.save(geofence);

        log.info("Geofence desativada - id: {}", id);
    }

    /**
     * Valida se uma localizacao esta dentro de uma geofence permitida.
     */
    @Transactional(readOnly = true)
    public GeofenceValidationResult validateLocation(UUID tenantId, UUID employeeId, double latitude, double longitude) {
        // Buscar geofences que contenham o ponto
        List<Geofence> containingGeofences = geofenceRepository.findContainingPoint(tenantId, latitude, longitude);

        if (containingGeofences.isEmpty()) {
            log.debug("Nenhuma geofence contem a localizacao ({}, {})", latitude, longitude);
            // Don't return yet, check company geofence
        }

        // Verificar se alguma geofence permite o colaborador
        for (Geofence geofence : containingGeofences) {
            if (isEmployeeAllowed(geofence, employeeId)) {
                log.debug("Colaborador {} autorizado na geofence {}", employeeId, geofence.getName());
                return new GeofenceValidationResult(true, geofence.getId(), geofence.getName());
            }
        }

        // Verificar geofence da sede (Company Profile)
        GeofenceValidationResult companyResult = checkCompanyGeofence(tenantId, latitude, longitude);
        if (companyResult.isWithin()) {
            log.debug("Colaborador {} autorizado na cerca digital da sede", employeeId);
            return companyResult;
        }

        // Colaborador nao autorizado nas geofences encontradas
        log.debug("Colaborador {} nao autorizado nas geofences encontradas", employeeId);
        return new GeofenceValidationResult(false, null, null);
    }

    /**
     * Verifica cerca digital definida no perfil da empresa.
     */
    private GeofenceValidationResult checkCompanyGeofence(UUID tenantId, double lat, double lon) {
        try {
            // Removemos o prefixo 'shared.' pois o default_schema ja eh 'shared'
            String sql = "SELECT geofence_enabled, geofence_latitude, geofence_longitude, geofence_radius " +
                         "FROM company_profiles WHERE tenant_id = ?";
            
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
                boolean enabled = rs.getBoolean("geofence_enabled");
                if (!enabled) return new GeofenceValidationResult(false, null, null);

                Double compLat = rs.getDouble("geofence_latitude");
                Double compLon = rs.getDouble("geofence_longitude");
                int radius = rs.getInt("geofence_radius");

                // Se latitude/longitude forem 0 ou null (getDouble retorna 0.0), ignoramos
                if (compLat == 0 && compLon == 0) return new GeofenceValidationResult(false, null, null);
                
                // Fallback de seguranca para raio
                if (radius <= 0) radius = 100;

                double distance = calculateDistance(compLat, compLon, lat, lon);
                if (distance <= radius) {
                    return new GeofenceValidationResult(true, tenantId, "Sede (Cerca Digital)");
                }
                return new GeofenceValidationResult(false, null, null);
            }, tenantId);
        } catch (Exception e) {
            log.error("Erro ao verificar cerca digital da empresa para tenant {}", tenantId, e);
            return new GeofenceValidationResult(false, null, null);
        }
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Raio da Terra em metros
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Verifica se colaborador esta autorizado em uma geofence.
     */
    private boolean isEmployeeAllowed(Geofence geofence, UUID employeeId) {
        // Se nao ha restricoes, permite todos
        if ((geofence.getDepartmentIds() == null || geofence.getDepartmentIds().isEmpty()) &&
            (geofence.getEmployeeIds() == null || geofence.getEmployeeIds().isEmpty())) {
            return true;
        }

        // Verifica se colaborador esta na lista
        if (geofence.getEmployeeIds() != null && !geofence.getEmployeeIds().isEmpty()) {
            List<UUID> allowedEmployees = fromJsonUUID(geofence.getEmployeeIds());
            return allowedEmployees.contains(employeeId);
        }

        // TODO: Verificar departamento do colaborador
        // Isso requer integracao com employee-service
        return true;
    }

    private GeofenceResponse toResponse(Geofence geofence) {
        String fullAddress = buildFullAddress(geofence);

        return GeofenceResponse.builder()
                .id(geofence.getId())
                .name(geofence.getName())
                .description(geofence.getDescription())
                .latitude(geofence.getLatitude())
                .longitude(geofence.getLongitude())
                .radiusMeters(geofence.getRadiusMeters())
                .address(geofence.getAddress())
                .city(geofence.getCity())
                .state(geofence.getState())
                .zipCode(geofence.getZipCode())
                .fullAddress(fullAddress)
                .locationType(geofence.getLocationType())
                .locationTypeLabel(getLocationTypeLabel(geofence.getLocationType()))
                .departmentIds(fromJsonUUID(geofence.getDepartmentIds()))
                .employeeIds(fromJsonUUID(geofence.getEmployeeIds()))
                .requireWifi(geofence.getRequireWifi())
                .wifiSsid(geofence.getWifiSsid())
                .active(geofence.getActive())
                .createdAt(geofence.getCreatedAt())
                .updatedAt(geofence.getUpdatedAt())
                .build();
    }

    /**
     * Lista geofences permitidas para o colaborador.
     */
    @Transactional(readOnly = true)
    public List<GeofenceResponse> getMyGeofences(UUID employeeId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        List<GeofenceResponse> geofences = new java.util.ArrayList<>(
            geofenceRepository.findByTenantIdAndActiveTrue(tenantId)
                .stream()
                .filter(geofence -> isEmployeeAllowed(geofence, employeeId))
                .map(this::toResponse)
                .toList()
        );

        // Adicionar cerca digital da empresa se configurada
        fetchCompanyGeofence(tenantId).ifPresent(geofences::add);

        return geofences;
    }

    private java.util.Optional<GeofenceResponse> fetchCompanyGeofence(UUID tenantId) {
        try {
            // Removemos o prefixo 'shared.' pois o default_schema ja eh 'shared'
            String sql = "SELECT geofence_enabled, geofence_latitude, geofence_longitude, geofence_radius, legal_name " +
                         "FROM company_profiles WHERE tenant_id = ?";
            
            return jdbcTemplate.query(sql, (rs) -> {
                if (rs.next()) {
                    boolean enabled = rs.getBoolean("geofence_enabled");
                    if (!enabled) {
                        log.debug("Cerca digital desabilitada para o tenant {}", tenantId);
                        return java.util.Optional.empty();
                    }

                    Double compLat = rs.getDouble("geofence_latitude");
                    Double compLon = rs.getDouble("geofence_longitude");
                    int radius = rs.getInt("geofence_radius");
                    String companyName = rs.getString("legal_name");

                    if (compLat == 0 && compLon == 0) {
                        log.debug("Cerca digital habilitada mas sem coordenadas para o tenant {}", tenantId);
                        return java.util.Optional.empty();
                    }
                    
                    // Fallback de seguranca para raio
                    if (radius <= 0) radius = 100;

                    return java.util.Optional.of(GeofenceResponse.builder()
                            .id(tenantId)
                            .name(companyName != null ? companyName : "Sede")
                            .description("Cerca digital da sede")
                            .latitude(compLat)
                            .longitude(compLon)
                            .radiusMeters(radius)
                            .locationType("HEADQUARTERS")
                            .locationTypeLabel("Matriz")
                            .active(true)
                            .build());
                }
                return java.util.Optional.empty();
            }, tenantId);
        } catch (Exception e) {
            log.error("Erro ao buscar cerca digital da empresa para tenant {}", tenantId, e);
            return java.util.Optional.empty();
        }
    }

    private String buildFullAddress(Geofence geofence) {
        StringBuilder sb = new StringBuilder();
        if (geofence.getAddress() != null) sb.append(geofence.getAddress());
        if (geofence.getCity() != null) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(geofence.getCity());
        }
        if (geofence.getState() != null) {
            if (!sb.isEmpty()) sb.append(" - ");
            sb.append(geofence.getState());
        }
        if (geofence.getZipCode() != null) {
            if (!sb.isEmpty()) sb.append(" - ");
            sb.append(geofence.getZipCode());
        }
        return sb.toString();
    }

    private String getLocationTypeLabel(String type) {
        if (type == null) return null;
        return switch (type) {
            case "HEADQUARTERS" -> "Matriz";
            case "BRANCH" -> "Filial";
            case "CLIENT" -> "Cliente";
            case "HOME_OFFICE" -> "Home Office";
            case "OTHER" -> "Outro";
            default -> type;
        };
    }

    private String toJson(List<UUID> list) {
        if (list == null || list.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            log.error("Erro ao serializar lista para JSON", e);
            return null;
        }
    }

    private List<UUID> fromJsonUUID(String json) {
        if (json == null || json.isEmpty()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<UUID>>() {});
        } catch (JsonProcessingException e) {
            log.error("Erro ao deserializar JSON para lista", e);
            return Collections.emptyList();
        }
    }
}
