package com.axonrh.core.setup.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "company_profiles")
public class CompanyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    // Legal Information
    @Column(name = "legal_name", nullable = false, length = 200)
    private String legalName;

    @Column(name = "trade_name", length = 200)
    private String tradeName;

    @Column(nullable = false, length = 14)
    private String cnpj;

    @Column(name = "state_registration", length = 20)
    private String stateRegistration;

    @Column(name = "municipal_registration", length = 20)
    private String municipalRegistration;

    // Contact
    @Column(length = 255)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String website;

    // Address
    @Column(name = "address_street", length = 200)
    private String addressStreet;

    @Column(name = "address_number", length = 20)
    private String addressNumber;

    @Column(name = "address_complement", length = 100)
    private String addressComplement;

    @Column(name = "address_neighborhood", length = 100)
    private String addressNeighborhood;

    @Column(name = "address_city", length = 100)
    private String addressCity;

    @Column(name = "address_state", length = 2)
    private String addressState;

    @Column(name = "address_zip_code", length = 8)
    private String addressZipCode;

    @Column(name = "address_country", length = 50)
    private String addressCountry = "Brasil";

    // Company Details
    @Enumerated(EnumType.STRING)
    @Column(name = "company_size", length = 20)
    private CompanySize companySize;

    @Column(length = 100)
    private String industry;

    @Column(name = "cnae_code", length = 10)
    private String cnaeCode;

    @Column(name = "founding_date")
    private LocalDate foundingDate;

    @Column(name = "employee_count")
    private Integer employeeCount;

    // Tax Regime
    @Enumerated(EnumType.STRING)
    @Column(name = "tax_regime", length = 50)
    private TaxRegime taxRegime;

    // Legal Representative
    @Column(name = "legal_representative_name", length = 200)
    private String legalRepresentativeName;

    @Column(name = "legal_representative_cpf", length = 11)
    private String legalRepresentativeCpf;

    @Column(name = "legal_representative_role", length = 100)
    private String legalRepresentativeRole;

    // Accountant
    @Column(name = "accountant_name", length = 200)
    private String accountantName;

    @Column(name = "accountant_crc", length = 20)
    private String accountantCrc;

    @Column(name = "accountant_email", length = 255)
    private String accountantEmail;

    @Column(name = "accountant_phone", length = 20)
    private String accountantPhone;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum CompanySize {
        MICRO,      // Up to 9 employees
        SMALL,      // 10-49 employees
        MEDIUM,     // 50-249 employees
        LARGE       // 250+ employees
    }

    public enum TaxRegime {
        SIMPLES,
        LUCRO_PRESUMIDO,
        LUCRO_REAL
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public String getLegalName() { return legalName; }
    public void setLegalName(String legalName) { this.legalName = legalName; }

    public String getTradeName() { return tradeName; }
    public void setTradeName(String tradeName) { this.tradeName = tradeName; }

    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }

    public String getStateRegistration() { return stateRegistration; }
    public void setStateRegistration(String stateRegistration) { this.stateRegistration = stateRegistration; }

    public String getMunicipalRegistration() { return municipalRegistration; }
    public void setMunicipalRegistration(String municipalRegistration) { this.municipalRegistration = municipalRegistration; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getAddressStreet() { return addressStreet; }
    public void setAddressStreet(String addressStreet) { this.addressStreet = addressStreet; }

    public String getAddressNumber() { return addressNumber; }
    public void setAddressNumber(String addressNumber) { this.addressNumber = addressNumber; }

    public String getAddressComplement() { return addressComplement; }
    public void setAddressComplement(String addressComplement) { this.addressComplement = addressComplement; }

    public String getAddressNeighborhood() { return addressNeighborhood; }
    public void setAddressNeighborhood(String addressNeighborhood) { this.addressNeighborhood = addressNeighborhood; }

    public String getAddressCity() { return addressCity; }
    public void setAddressCity(String addressCity) { this.addressCity = addressCity; }

    public String getAddressState() { return addressState; }
    public void setAddressState(String addressState) { this.addressState = addressState; }

    public String getAddressZipCode() { return addressZipCode; }
    public void setAddressZipCode(String addressZipCode) { this.addressZipCode = addressZipCode; }

    public String getAddressCountry() { return addressCountry; }
    public void setAddressCountry(String addressCountry) { this.addressCountry = addressCountry; }

    public CompanySize getCompanySize() { return companySize; }
    public void setCompanySize(CompanySize companySize) { this.companySize = companySize; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public String getCnaeCode() { return cnaeCode; }
    public void setCnaeCode(String cnaeCode) { this.cnaeCode = cnaeCode; }

    public LocalDate getFoundingDate() { return foundingDate; }
    public void setFoundingDate(LocalDate foundingDate) { this.foundingDate = foundingDate; }

    public Integer getEmployeeCount() { return employeeCount; }
    public void setEmployeeCount(Integer employeeCount) { this.employeeCount = employeeCount; }

    public TaxRegime getTaxRegime() { return taxRegime; }
    public void setTaxRegime(TaxRegime taxRegime) { this.taxRegime = taxRegime; }

    public String getLegalRepresentativeName() { return legalRepresentativeName; }
    public void setLegalRepresentativeName(String legalRepresentativeName) { this.legalRepresentativeName = legalRepresentativeName; }

    public String getLegalRepresentativeCpf() { return legalRepresentativeCpf; }
    public void setLegalRepresentativeCpf(String legalRepresentativeCpf) { this.legalRepresentativeCpf = legalRepresentativeCpf; }

    public String getLegalRepresentativeRole() { return legalRepresentativeRole; }
    public void setLegalRepresentativeRole(String legalRepresentativeRole) { this.legalRepresentativeRole = legalRepresentativeRole; }

    public String getAccountantName() { return accountantName; }
    public void setAccountantName(String accountantName) { this.accountantName = accountantName; }

    public String getAccountantCrc() { return accountantCrc; }
    public void setAccountantCrc(String accountantCrc) { this.accountantCrc = accountantCrc; }

    public String getAccountantEmail() { return accountantEmail; }
    public void setAccountantEmail(String accountantEmail) { this.accountantEmail = accountantEmail; }

    public String getAccountantPhone() { return accountantPhone; }
    public void setAccountantPhone(String accountantPhone) { this.accountantPhone = accountantPhone; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (addressStreet != null) sb.append(addressStreet);
        if (addressNumber != null) sb.append(", ").append(addressNumber);
        if (addressComplement != null) sb.append(" - ").append(addressComplement);
        if (addressNeighborhood != null) sb.append(", ").append(addressNeighborhood);
        if (addressCity != null) sb.append(" - ").append(addressCity);
        if (addressState != null) sb.append("/").append(addressState);
        if (addressZipCode != null) sb.append(" - CEP: ").append(addressZipCode);
        return sb.toString();
    }
}
