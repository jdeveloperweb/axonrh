package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.EmployeeRequest;
import com.axonrh.employee.dto.EmployeeResponse;
import com.axonrh.employee.entity.Department;
import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.entity.Position;
import com.axonrh.employee.entity.enums.EmployeeStatus;
import com.axonrh.employee.entity.enums.EmploymentType;
import com.axonrh.employee.exception.DuplicateResourceException;
import com.axonrh.employee.exception.InvalidCpfException;
import com.axonrh.employee.exception.ResourceNotFoundException;
import com.axonrh.employee.mapper.EmployeeMapper;
import com.axonrh.employee.repository.*;
import com.axonrh.kafka.producer.DomainEventPublisher;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Testes do EmployeeService.
 */
@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private PositionRepository positionRepository;

    @Mock
    private CostCenterRepository costCenterRepository;

    @Mock
    private EmployeeHistoryRepository historyRepository;

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private CpfValidator cpfValidator;

    @Mock
    private DomainEventPublisher eventPublisher;

    @InjectMocks
    private EmployeeService employeeService;

    private UUID tenantId;
    private UUID userId;
    private Employee testEmployee;
    private EmployeeRequest testRequest;
    private EmployeeResponse testResponse;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId.toString());

        testEmployee = Employee.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .cpf("52998224725")
                .fullName("Maria Silva")
                .email("maria@empresa.com")
                .birthDate(LocalDate.of(1990, 5, 15))
                .hireDate(LocalDate.of(2020, 1, 10))
                .employmentType(EmploymentType.CLT)
                .status(EmployeeStatus.ACTIVE)
                .isActive(true)
                .build();

        testRequest = EmployeeRequest.builder()
                .cpf("52998224725")
                .fullName("Maria Silva")
                .email("maria@empresa.com")
                .birthDate(LocalDate.of(1990, 5, 15))
                .hireDate(LocalDate.of(2020, 1, 10))
                .employmentType(EmploymentType.CLT)
                .build();

        testResponse = EmployeeResponse.builder()
                .id(testEmployee.getId())
                .tenantId(tenantId)
                .cpf("52998224725")
                .fullName("Maria Silva")
                .email("maria@empresa.com")
                .status(EmployeeStatus.ACTIVE)
                .build();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Nested
    @DisplayName("findAll")
    class FindAllTests {

        @Test
        @DisplayName("Deve retornar lista paginada de colaboradores")
        void shouldReturnPaginatedEmployees() {
            // Given
            PageRequest pageable = PageRequest.of(0, 10);
            Page<Employee> page = new PageImpl<>(List.of(testEmployee));

            when(employeeRepository.findByTenantIdAndIsActiveTrue(tenantId, pageable))
                    .thenReturn(page);
            when(employeeMapper.toResponse(testEmployee)).thenReturn(testResponse);

            // When
            Page<EmployeeResponse> result = employeeService.findAll(pageable);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.getContent().get(0).getFullName()).isEqualTo("Maria Silva");
        }
    }

    @Nested
    @DisplayName("findById")
    class FindByIdTests {

        @Test
        @DisplayName("Deve retornar colaborador quando encontrado")
        void shouldReturnEmployeeWhenFound() {
            // Given
            UUID id = testEmployee.getId();
            when(employeeRepository.findByIdWithRelations(tenantId, id))
                    .thenReturn(Optional.of(testEmployee));
            when(employeeMapper.toResponse(testEmployee)).thenReturn(testResponse);

            // When
            EmployeeResponse result = employeeService.findById(id);

            // Then
            assertThat(result.getId()).isEqualTo(id);
            assertThat(result.getFullName()).isEqualTo("Maria Silva");
        }

        @Test
        @DisplayName("Deve lancar excecao quando nao encontrado")
        void shouldThrowExceptionWhenNotFound() {
            // Given
            UUID id = UUID.randomUUID();
            when(employeeRepository.findByIdWithRelations(tenantId, id))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> employeeService.findById(id))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Colaborador nao encontrado");
        }
    }

    @Nested
    @DisplayName("create")
    class CreateTests {

        @Test
        @DisplayName("Deve criar colaborador com dados validos")
        void shouldCreateEmployeeWithValidData() {
            // Given
            when(cpfValidator.unformat("52998224725")).thenReturn("52998224725");
            when(cpfValidator.isValid("52998224725")).thenReturn(true);
            when(employeeRepository.existsByTenantIdAndCpf(tenantId, "52998224725")).thenReturn(false);
            when(employeeRepository.existsByTenantIdAndEmail(tenantId, "maria@empresa.com")).thenReturn(false);
            when(employeeMapper.toEntity(testRequest)).thenReturn(testEmployee);
            when(employeeRepository.save(any(Employee.class))).thenReturn(testEmployee);
            when(employeeMapper.toResponse(testEmployee)).thenReturn(testResponse);

            // When
            EmployeeResponse result = employeeService.create(testRequest, userId);

            // Then
            assertThat(result.getFullName()).isEqualTo("Maria Silva");
            verify(employeeRepository).save(any(Employee.class));
            verify(historyRepository).save(any());
        }

        @Test
        @DisplayName("Deve rejeitar CPF invalido")
        void shouldRejectInvalidCpf() {
            // Given
            when(cpfValidator.unformat("12345678901")).thenReturn("12345678901");
            when(cpfValidator.isValid("12345678901")).thenReturn(false);

            EmployeeRequest invalidRequest = EmployeeRequest.builder()
                    .cpf("12345678901")
                    .fullName("Joao")
                    .email("joao@email.com")
                    .birthDate(LocalDate.of(1990, 1, 1))
                    .hireDate(LocalDate.now())
                    .employmentType(EmploymentType.CLT)
                    .build();

            // When & Then
            assertThatThrownBy(() -> employeeService.create(invalidRequest, userId))
                    .isInstanceOf(InvalidCpfException.class)
                    .hasMessageContaining("CPF invalido");
        }

        @Test
        @DisplayName("Deve rejeitar CPF duplicado")
        void shouldRejectDuplicateCpf() {
            // Given
            when(cpfValidator.unformat("52998224725")).thenReturn("52998224725");
            when(cpfValidator.isValid("52998224725")).thenReturn(true);
            when(employeeRepository.existsByTenantIdAndCpf(tenantId, "52998224725")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> employeeService.create(testRequest, userId))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("Ja existe colaborador com este CPF");
        }

        @Test
        @DisplayName("Deve rejeitar email duplicado")
        void shouldRejectDuplicateEmail() {
            // Given
            when(cpfValidator.unformat("52998224725")).thenReturn("52998224725");
            when(cpfValidator.isValid("52998224725")).thenReturn(true);
            when(employeeRepository.existsByTenantIdAndCpf(tenantId, "52998224725")).thenReturn(false);
            when(employeeRepository.existsByTenantIdAndEmail(tenantId, "maria@empresa.com")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> employeeService.create(testRequest, userId))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("Ja existe colaborador com este email");
        }
    }

    @Nested
    @DisplayName("update")
    class UpdateTests {

        @Test
        @DisplayName("Deve atualizar colaborador existente")
        void shouldUpdateExistingEmployee() {
            // Given
            UUID id = testEmployee.getId();
            EmployeeRequest updateRequest = EmployeeRequest.builder()
                    .cpf("52998224725")
                    .fullName("Maria Silva Santos")
                    .email("maria@empresa.com")
                    .birthDate(LocalDate.of(1990, 5, 15))
                    .hireDate(LocalDate.of(2020, 1, 10))
                    .employmentType(EmploymentType.CLT)
                    .build();

            when(employeeRepository.findByTenantIdAndId(tenantId, id))
                    .thenReturn(Optional.of(testEmployee));
            when(cpfValidator.unformat("52998224725")).thenReturn("52998224725");
            when(cpfValidator.isValid("52998224725")).thenReturn(true);
            when(employeeRepository.save(any(Employee.class))).thenReturn(testEmployee);
            when(employeeMapper.toResponse(testEmployee)).thenReturn(testResponse);

            // When
            EmployeeResponse result = employeeService.update(id, updateRequest, userId);

            // Then
            verify(employeeRepository).save(any(Employee.class));
            verify(employeeMapper).updateEntity(testEmployee, updateRequest);
        }
    }

    @Nested
    @DisplayName("terminate")
    class TerminateTests {

        @Test
        @DisplayName("Deve desligar colaborador")
        void shouldTerminateEmployee() {
            // Given
            UUID id = testEmployee.getId();
            LocalDate terminationDate = LocalDate.now();

            when(employeeRepository.findByTenantIdAndId(tenantId, id))
                    .thenReturn(Optional.of(testEmployee));
            when(employeeRepository.save(any(Employee.class))).thenReturn(testEmployee);
            when(employeeMapper.toResponse(testEmployee)).thenReturn(testResponse);

            // When
            EmployeeResponse result = employeeService.terminate(id, terminationDate, "Pedido de demissao", userId);

            // Then
            assertThat(testEmployee.getStatus()).isEqualTo(EmployeeStatus.TERMINATED);
            assertThat(testEmployee.getTerminationDate()).isEqualTo(terminationDate);
            assertThat(testEmployee.getIsActive()).isFalse();
            verify(historyRepository).save(any());
        }
    }

    @Nested
    @DisplayName("countActive")
    class CountActiveTests {

        @Test
        @DisplayName("Deve contar colaboradores ativos")
        void shouldCountActiveEmployees() {
            // Given
            when(employeeRepository.countByTenantIdAndIsActiveTrue(tenantId)).thenReturn(50L);

            // When
            long count = employeeService.countActive();

            // Then
            assertThat(count).isEqualTo(50L);
        }
    }
}
