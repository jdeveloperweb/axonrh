package com.axonrh.employee.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade para acessar dados da empresa (mapeada para a tabela shared.company_profiles).
 */
@Entity
@Table(name = "company_profiles", schema = "shared")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyProfile {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    @Column(name = "legal_name", nullable = false)
    private String legalName;

    @Column(name = "trade_name")
    private String tradeName;

    @Column(nullable = false)
    private String cnpj;

    @Column(name = "address_street")
    private String addressStreet;

    @Column(name = "address_number")
    private String addressNumber;

    @Column(name = "address_neighborhood")
    private String addressNeighborhood;

    @Column(name = "address_city")
    private String addressCity;

    @Column(name = "address_state")
    private String addressState;

    @Column(name = "address_zip_code")
    private String addressZipCode;

    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (addressStreet != null) sb.append(addressStreet);
        if (addressNumber != null) sb.append(", ").append(addressNumber);
        if (addressNeighborhood != null) sb.append(", ").append(addressNeighborhood);
        if (addressCity != null) sb.append(" - ").append(addressCity);
        if (addressState != null) sb.append("/").append(addressState);
        return sb.toString();
    }
}
