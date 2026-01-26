package com.axonrh.employee.entity;

import com.axonrh.employee.entity.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entidade principal de colaborador.
 * Contem todos os dados pessoais, profissionais e bancarios.
 */
@Entity
@Table(name = "employees")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    // ==================== Dados Pessoais ====================

    @Column(name = "registration_number", length = 20)
    private String registrationNumber;

    @Column(name = "cpf", nullable = false, length = 11)
    private String cpf;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "social_name", length = 200)
    private String socialName;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 20)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(name = "marital_status", length = 20)
    private MaritalStatus maritalStatus;

    @Column(name = "nationality", length = 50)
    @Builder.Default
    private String nationality = "Brasileira";

    @Column(name = "birth_city", length = 100)
    private String birthCity;

    @Column(name = "birth_state", length = 2)
    private String birthState;

    @Column(name = "mother_name", length = 200)
    private String motherName;

    @Column(name = "father_name", length = 200)
    private String fatherName;

    // ==================== Documentos ====================

    @Column(name = "rg_number", length = 20)
    private String rgNumber;

    @Column(name = "rg_issuer", length = 20)
    private String rgIssuer;

    @Column(name = "rg_state", length = 2)
    private String rgState;

    @Column(name = "rg_issue_date")
    private LocalDate rgIssueDate;

    @Column(name = "pis_pasep", length = 15)
    private String pisPasep;

    @Column(name = "ctps_number", length = 20)
    private String ctpsNumber;

    @Column(name = "ctps_series", length = 10)
    private String ctpsSeries;

    @Column(name = "ctps_state", length = 2)
    private String ctpsState;

    @Column(name = "ctps_issue_date")
    private LocalDate ctpsIssueDate;

    @Column(name = "voter_title", length = 20)
    private String voterTitle;

    @Column(name = "voter_zone", length = 10)
    private String voterZone;

    @Column(name = "voter_section", length = 10)
    private String voterSection;

    @Column(name = "military_certificate", length = 20)
    private String militaryCertificate;

    @Column(name = "driver_license", length = 20)
    private String driverLicense;

    @Column(name = "driver_license_category", length = 5)
    private String driverLicenseCategory;

    @Column(name = "driver_license_expiry")
    private LocalDate driverLicenseExpiry;

    // ==================== Contato ====================

    @Column(name = "email", nullable = false, length = 200)
    private String email;

    @Column(name = "personal_email", length = 200)
    private String personalEmail;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "mobile", length = 20)
    private String mobile;

    @Column(name = "emergency_contact_name", length = 200)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    @Column(name = "emergency_contact_relationship", length = 50)
    private String emergencyContactRelationship;

    // ==================== Endereco ====================

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

    @Column(name = "address_zip_code", length = 10)
    private String addressZipCode;

    @Column(name = "address_country", length = 50)
    @Builder.Default
    private String addressCountry = "Brasil";

    // ==================== Dados Profissionais ====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cost_center_id")
    private CostCenter costCenter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Column(name = "hire_date", nullable = false)
    private LocalDate hireDate;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false, length = 30)
    private EmploymentType employmentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_regime", length = 30)
    private WorkRegime workRegime;

    @Column(name = "weekly_hours")
    @Builder.Default
    private Integer weeklyHours = 44;

    @Column(name = "shift", length = 50)
    private String shift;

    // ==================== Dados Bancarios ====================

    @Column(name = "bank_code", length = 10)
    private String bankCode;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_agency", length = 10)
    private String bankAgency;

    @Column(name = "bank_agency_digit", length = 2)
    private String bankAgencyDigit;

    @Column(name = "bank_account", length = 20)
    private String bankAccount;

    @Column(name = "bank_account_digit", length = 2)
    private String bankAccountDigit;

    @Enumerated(EnumType.STRING)
    @Column(name = "bank_account_type", length = 20)
    private BankAccountType bankAccountType;

    @Column(name = "pix_key", length = 100)
    private String pixKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "pix_key_type", length = 20)
    private PixKeyType pixKeyType;

    // ==================== Salario ====================

    @Column(name = "base_salary", precision = 15, scale = 2)
    private BigDecimal baseSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "salary_type", length = 20)
    private SalaryType salaryType;

    // ==================== Outros ====================

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    // ==================== Relacionamentos ====================

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EmployeeDependent> dependents = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EmployeeDocument> documents = new ArrayList<>();

    // ==================== Auditoria ====================

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private UUID createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private UUID updatedBy;

    // ==================== Metodos ====================

    public String getDisplayName() {
        return socialName != null && !socialName.isBlank() ? socialName : fullName;
    }

    public void addDependent(EmployeeDependent dependent) {
        dependents.add(dependent);
        dependent.setEmployee(this);
        dependent.setTenantId(this.tenantId);
    }

    public void removeDependent(EmployeeDependent dependent) {
        dependents.remove(dependent);
        dependent.setEmployee(null);
    }

    public void addDocument(EmployeeDocument document) {
        documents.add(document);
        document.setEmployee(this);
        document.setTenantId(this.tenantId);
    }

    public void terminate(LocalDate terminationDate) {
        this.terminationDate = terminationDate;
        this.status = EmployeeStatus.TERMINATED;
        this.isActive = false;
    }
}
