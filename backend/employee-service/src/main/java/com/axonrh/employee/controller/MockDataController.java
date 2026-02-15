package com.axonrh.employee.controller;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.EmployeeRequest;
import com.axonrh.employee.dto.EmployeeResponse;
import com.axonrh.employee.entity.Department;
import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.entity.Position;
import com.axonrh.employee.entity.enums.EmploymentType;
import com.axonrh.employee.entity.enums.WorkRegime;
import com.axonrh.employee.repository.DepartmentRepository;
import com.axonrh.employee.repository.EmployeeRepository;
import com.axonrh.employee.repository.PositionRepository;
import com.axonrh.employee.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/mock")
@RequiredArgsConstructor
@Slf4j
public class MockDataController {

    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;

    private final Random random = new Random();

    private final String[] NAMES = {"João", "Maria", "Pedro", "Ana", "Carlos", "Fernanda", "Lucas", "Juliana", "Marcos", "Patrícia", "Gabriel", "Aline", "Rafael", "Camila", "Bruno", "Larissa", "Daniel", "Mariana", "Thiago", "Letícia"};
    private final String[] SURNAMES = {"Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Almeida", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Araujo", "Melo", "Barbosa", "Castro", "Cardoso", "Fernandes"};

    @PostMapping("/departments")
    public ResponseEntity<List<Department>> seedDepartments() {
        UUID tenantId = getTenantId();
        List<Department> created = createMockDepartments(tenantId);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/positions")
    public ResponseEntity<List<Position>> seedPositions() {
        UUID tenantId = getTenantId();
        
        List<Department> departments = departmentRepository.findByTenantIdAndIsActiveTrueOrderByName(tenantId);
        if (departments.isEmpty()) {
            // Se nao tem departamentos, cria
            departments = createMockDepartments(tenantId);
        }

        List<Position> created = createMockPositions(tenantId, departments);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/employees")
    public ResponseEntity<Map<String, Object>> seedEmployees(@RequestParam(defaultValue = "20") int count) {
        UUID tenantId = getTenantId();
        UUID userId = UUID.randomUUID(); // Dummy user ID for creation audit

        log.info("Iniciando carga de {} colaboradores mockados para tenant {}", count, tenantId);

        // Ensure we have at least one department and position
        List<Department> departments = departmentRepository.findByTenantIdAndIsActiveTrueOrderByName(tenantId);
        if (departments.isEmpty()) {
            departments = createMockDepartments(tenantId);
        }
        
        List<Position> positions = positionRepository.findByTenantIdAndIsActiveTrueOrderByTitle(tenantId);
        if (positions.isEmpty()) {
            positions = createMockPositions(tenantId, departments);
        }

        int createdCount = 0;
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            try {
                String firstName = NAMES[random.nextInt(NAMES.length)];
                String lastName = SURNAMES[random.nextInt(SURNAMES.length)] + " " + SURNAMES[random.nextInt(SURNAMES.length)];
                String fullName = firstName + " " + lastName;
                String cpf = generateCpf();
                String email = firstName.toLowerCase() + "." + lastName.split(" ")[0].toLowerCase() + "_" + random.nextInt(1000) + "@axonrh.com";

                Department dept = departments.get(random.nextInt(departments.size()));
                
                // Try to find a position that belongs to this department, otherwise pick random
                Position pos = positions.stream()
                        .filter(p -> p.getDepartment() != null && p.getDepartment().getId().equals(dept.getId()))
                        .findAny()
                        .orElse(positions.get(random.nextInt(positions.size())));

                EmployeeRequest request = EmployeeRequest.builder()
                        .fullName(fullName)
                        .socialName(firstName + " " + lastName.split(" ")[0])
                        .cpf(cpf)
                        .email(email)
                        .birthDate(LocalDate.now().minusYears(18 + random.nextInt(40)))
                        .hireDate(LocalDate.now().minusDays(random.nextInt(365 * 5)))
                        .employmentType(EmploymentType.CLT)
                        .workRegime(WorkRegime.values()[random.nextInt(WorkRegime.values().length)])
                        .departmentId(dept.getId())
                        .positionId(pos.getId())
                        .baseSalary(new BigDecimal(3000 + random.nextInt(15000)))
                        .weeklyHours(44)
                        .build();

                EmployeeResponse response = employeeService.create(request, userId);
                
                // Update photo with mock image
                String photoUrl = "https://i.pravatar.cc/300?u=" + response.getId();
                
                Employee employee = employeeRepository.findByTenantIdAndId(tenantId, response.getId()).orElseThrow();
                employee.setPhotoUrl(photoUrl);
                employeeRepository.save(employee);
                
                createdCount++;
                log.info("Mock Employee created: {}", fullName);

            } catch (Exception e) {
                log.error("Erro ao criar colaborador mock: {}", e.getMessage());
                errors.add(e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Carga de dados finalizada");
        result.put("requested", count);
        result.put("created", createdCount);
        result.put("errors", errors);

        return ResponseEntity.ok(result);
    }

    private List<Department> createMockDepartments(UUID tenantId) {
        List<Department> created = new ArrayList<>();
        String[] deptNames = {"Tecnologia da Informação", "Recursos Humanos", "Comercial", "Financeiro", "Operações", "Marketing", "Jurídico"};
        
        for (String name : deptNames) {
            // Check if exists
            Optional<Department> exists = departmentRepository.findByTenantIdAndCode(tenantId, name.substring(0, 3).toUpperCase());
            if (exists.isPresent()) {
                created.add(exists.get());
                continue;
            }

            Department d = Department.builder()
                    .tenantId(tenantId)
                    .name(name)
                    .code(name.substring(0, 3).toUpperCase())
                    .description("Departamento de " + name)
                    .isActive(true)
                    .build();
            created.add(departmentRepository.save(d));
        }
        return created;
    }

    private List<Position> createMockPositions(UUID tenantId, List<Department> departments) {
        List<Position> created = new ArrayList<>();
        
        Map<String, List<String>> deptPositions = new HashMap<>();
        deptPositions.put("Tecnologia da Informação", Arrays.asList("Desenvolvedor Backend", "Desenvolvedor Frontend", "Tech Lead", "QA Automation", "DevOps Engineer"));
        deptPositions.put("Recursos Humanos", Arrays.asList("Analista de RH", "Business Partner", "Gerente de RH", "Recrutador"));
        deptPositions.put("Comercial", Arrays.asList("Executivo de Vendas", "Pré-vendas (SDR)", "Gerente Comercial"));
        deptPositions.put("Financeiro", Arrays.asList("Analista Financeiro", "Controller", "Assistente Financeiro"));
        deptPositions.put("Operações", Arrays.asList("Analista de Operações", "Coordenador de Operações"));
        deptPositions.put("Marketing", Arrays.asList("Analista de Marketing", "Designer", "Copywriter"));
        deptPositions.put("Jurídico", Arrays.asList("Advogado Jr", "Advogado Pleno", "Advogado Sr"));

        for (Department dept : departments) {
            List<String> titles = deptPositions.getOrDefault(dept.getName(), Arrays.asList("Assistente", "Analista", "Gerente"));
            
            for (String title : titles) {
                 // Check if exists
                String code = (dept.getCode() + "-" + title.substring(0, 3)).toUpperCase().replaceAll("\\s+", "");
                if (code.length() > 20) code = code.substring(0, 20);

                Optional<Position> exists = positionRepository.findByTenantIdAndCode(tenantId, code);
                if (exists.isPresent()) {
                    created.add(exists.get());
                    continue;
                }

                Position p = Position.builder()
                        .tenantId(tenantId)
                        .title(title)
                        .code(code)
                        .department(dept)
                        .isActive(true)
                        .salaryRangeMin(new BigDecimal("3000.00"))
                        .salaryRangeMax(new BigDecimal("15000.00"))
                        .build();
                created.add(positionRepository.save(p));
            }
        }
        return created;
    }

    private UUID getTenantId() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null) {
            throw new IllegalStateException("Tenant nao definido no contexto. Chame a API autenticado.");
        }
        return UUID.fromString(tenant);
    }

    private String generateCpf() {
        int n1 = random.nextInt(10);
        int n2 = random.nextInt(10);
        int n3 = random.nextInt(10);
        int n4 = random.nextInt(10);
        int n5 = random.nextInt(10);
        int n6 = random.nextInt(10);
        int n7 = random.nextInt(10);
        int n8 = random.nextInt(10);
        int n9 = random.nextInt(10);

        int d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
        d1 = 11 - (d1 % 11);
        if (d1 >= 10) d1 = 0;

        int d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
        d2 = 11 - (d2 % 11);
        if (d2 >= 10) d2 = 0;

        return String.format("%d%d%d%d%d%d%d%d%d%d%d", n1, n2, n3, n4, n5, n6, n7, n8, n9, d1, d2);
    }
}
