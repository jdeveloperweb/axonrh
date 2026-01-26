package com.axonrh.timesheet.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * T131 - Geofence (cerca geografica).
 * Define locais onde o registro de ponto eh permitido.
 */
@Entity
@Table(name = "geofences", indexes = {
    @Index(name = "idx_geofences_tenant", columnList = "tenant_id"),
    @Index(name = "idx_geofences_active", columnList = "tenant_id, active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Geofence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    // Coordenadas do centro
    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    // Raio em metros
    @Column(name = "radius_meters", nullable = false)
    @Builder.Default
    private Integer radiusMeters = 100;

    // Endereco (para exibicao)
    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 50)
    private String state;

    @Column(name = "zip_code", length = 10)
    private String zipCode;

    // Tipo de local
    @Column(name = "location_type", length = 50)
    private String locationType; // HEADQUARTERS, BRANCH, CLIENT, HOME_OFFICE, OTHER

    // Departamentos permitidos (null = todos)
    @Column(name = "department_ids", length = 2000)
    private String departmentIds; // JSON array

    // Colaboradores especificos (null = todos do departamento)
    @Column(name = "employee_ids", length = 2000)
    private String employeeIds; // JSON array

    // Configuracoes
    @Column(name = "require_wifi")
    @Builder.Default
    private Boolean requireWifi = false;

    @Column(name = "wifi_ssid", length = 100)
    private String wifiSsid;

    @Column(name = "wifi_bssid", length = 50)
    private String wifiBssid;

    // Status
    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    // Auditoria
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    /**
     * Verifica se um ponto esta dentro do geofence.
     */
    public boolean containsPoint(double lat, double lon) {
        double distance = calculateDistance(this.latitude, this.longitude, lat, lon);
        return distance <= this.radiusMeters;
    }

    /**
     * Calcula distancia entre dois pontos usando formula de Haversine.
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Raio da Terra em metros

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}
