package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.AdmissionProcessRequest;
import com.axonrh.employee.dto.AdmissionProcessResponse;
import com.axonrh.employee.entity.AdmissionProcess;
import com.axonrh.employee.entity.Department;
import com.axonrh.employee.entity.Position;
import com.axonrh.employee.entity.enums.AdmissionStatus;
import com.axonrh.employee.exception.DuplicateResourceException;
import com.axonrh.employee.exception.InvalidOperationException;
import com.axonrh.employee.exception.ResourceNotFoundException;
import com.axonrh.employee.repository.AdmissionDocumentRepository;
import com.axonrh.employee.repository.AdmissionProcessRepository;
import com.axonrh.employee.repository.DepartmentRepository;
import com.axonrh.employee.repository.PositionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * T123 - Tests for AdmissionService (Digital Admission Workflow)
 */
@ExtendWith(MockitoExtension.class)
class AdmissionServiceTest {

    @Mock
    private AdmissionProcessRepository admissionRepository;

    @Mock
    private AdmissionDocumentRepository admissionDocumentRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private PositionRepository positionRepository;

    @Mock
    private EmployeeService employeeService;

    @Mock
    private ContractService contractService;

    @Mock
    private DocumentValidationService documentValidationService;

    @Mock
    private StorageService storageService;

    @Mock
    private EsocialService esocialService;

    @InjectMocks
    private AdmissionService admissionService;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();
    private static final String CANDIDATE_EMAIL = "candidato@example.com";
    private static final String CANDIDATE_NAME = "João Silva";
    private static final String CANDIDATE_CPF = "12345678901";

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID.toString());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("T109 - Deve criar processo de admissão com link válido")
    void shouldCreateAdmissionProcessWithValidLink() {
        // Given
        AdmissionProcessRequest request = createRequest();

        when(admissionRepository.existsByTenantIdAndCandidateEmailAndStatusNotIn(
                eq(TENANT_ID), eq(CANDIDATE_EMAIL), anyList()))
                .thenReturn(false);

        when(admissionRepository.save(any(AdmissionProcess.class)))
                .thenAnswer(invocation -> {
                    AdmissionProcess p = invocation.getArgument(0);
                    p.setId(UUID.randomUUID());
                    p.setCreatedAt(LocalDateTime.now());
                    return p;
                });

        // When
        AdmissionProcessResponse response = admissionService.createAdmissionProcess(request, USER_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getCandidateName()).isEqualTo(CANDIDATE_NAME);
        assertThat(response.getCandidateEmail()).isEqualTo(CANDIDATE_EMAIL);
        assertThat(response.getStatus()).isEqualTo(AdmissionStatus.LINK_GENERATED);
        assertThat(response.getAccessToken()).isNotNull();
        assertThat(response.getPublicLink()).contains(response.getAccessToken());
        assertThat(response.getCurrentStep()).isEqualTo(1);
        assertThat(response.getLinkValid()).isTrue();

        ArgumentCaptor<AdmissionProcess> captor = ArgumentCaptor.forClass(AdmissionProcess.class);
        verify(admissionRepository).save(captor.capture());

        AdmissionProcess saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(saved.getAccessToken()).hasSize(43); // Base64 URL encoded 32 bytes
        assertThat(saved.getLinkExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    @DisplayName("Deve rejeitar criação se já existe processo ativo para o email")
    void shouldRejectIfActiveProcessExistsForEmail() {
        // Given
        AdmissionProcessRequest request = createRequest();

        when(admissionRepository.existsByTenantIdAndCandidateEmailAndStatusNotIn(
                eq(TENANT_ID), eq(CANDIDATE_EMAIL), anyList()))
                .thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> admissionService.createAdmissionProcess(request, USER_ID))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("processo de admissao ativo");
    }

    @Test
    @DisplayName("Deve criar processo com departamento e cargo")
    void shouldCreateProcessWithDepartmentAndPosition() {
        // Given
        UUID deptId = UUID.randomUUID();
        UUID posId = UUID.randomUUID();

        AdmissionProcessRequest request = AdmissionProcessRequest.builder()
                .candidateName(CANDIDATE_NAME)
                .candidateEmail(CANDIDATE_EMAIL)
                .candidateCpf(CANDIDATE_CPF)
                .departmentId(deptId)
                .positionId(posId)
                .build();

        Department dept = new Department();
        dept.setId(deptId);
        dept.setName("TI");

        Position pos = new Position();
        pos.setId(posId);
        pos.setTitle("Desenvolvedor");

        when(admissionRepository.existsByTenantIdAndCandidateEmailAndStatusNotIn(any(), any(), anyList()))
                .thenReturn(false);
        when(departmentRepository.findByTenantIdAndId(TENANT_ID, deptId))
                .thenReturn(Optional.of(dept));
        when(positionRepository.findByTenantIdAndId(TENANT_ID, posId))
                .thenReturn(Optional.of(pos));
        when(admissionRepository.save(any()))
                .thenAnswer(inv -> {
                    AdmissionProcess p = inv.getArgument(0);
                    p.setId(UUID.randomUUID());
                    return p;
                });

        // When
        AdmissionProcessResponse response = admissionService.createAdmissionProcess(request, USER_ID);

        // Then
        assertThat(response.getDepartment()).isNotNull();
        assertThat(response.getDepartment().getName()).isEqualTo("TI");
        assertThat(response.getPosition()).isNotNull();
    }

    @Test
    @DisplayName("Deve acessar processo por token e registrar primeiro acesso")
    void shouldAccessProcessByTokenAndRegisterFirstAccess() {
        // Given
        String token = "valid-token-123";
        AdmissionProcess process = createProcess(token);
        process.setLinkAccessedAt(null); // First access

        when(admissionRepository.findByAccessTokenWithDocuments(token))
                .thenReturn(Optional.of(process));
        when(admissionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        AdmissionProcessResponse response = admissionService.findByToken(token);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(AdmissionStatus.DATA_FILLING);
        assertThat(response.getCurrentStep()).isEqualTo(2);

        verify(admissionRepository).save(argThat(p ->
                p.getLinkAccessedAt() != null &&
                p.getStatus() == AdmissionStatus.DATA_FILLING
        ));
    }

    @Test
    @DisplayName("Deve rejeitar acesso com link expirado")
    void shouldRejectExpiredLink() {
        // Given
        String token = "expired-token";
        AdmissionProcess process = createProcess(token);
        process.setLinkExpiresAt(LocalDateTime.now().minusDays(1));

        when(admissionRepository.findByAccessTokenWithDocuments(token))
                .thenReturn(Optional.of(process));
        when(admissionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        // When/Then
        assertThatThrownBy(() -> admissionService.findByToken(token))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("expirado");
    }

    @Test
    @DisplayName("Deve salvar dados do candidato e avançar para documentos")
    void shouldSaveCandidateDataAndAdvanceToDocuments() {
        // Given
        String token = "valid-token";
        AdmissionProcess process = createProcess(token);
        process.setStatus(AdmissionStatus.DATA_FILLING);
        process.setCurrentStep(2);

        Map<String, Object> data = new HashMap<>();
        data.put("cpf", "98765432100");
        data.put("birthDate", "1990-05-15");
        data.put("addressCity", "São Paulo");

        when(admissionRepository.findByAccessToken(token))
                .thenReturn(Optional.of(process));
        when(admissionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        AdmissionProcessResponse response = admissionService.saveCandidateData(token, data);

        // Then
        assertThat(response.getStatus()).isEqualTo(AdmissionStatus.DOCUMENTS_PENDING);
        assertThat(response.getCurrentStep()).isEqualTo(3);

        verify(admissionRepository).save(argThat(p ->
                p.getCandidateData() != null &&
                p.getCandidateCpf().equals("98765432100")
        ));
    }

    @Test
    @DisplayName("Deve reenviar link de admissão")
    void shouldResendAdmissionLink() {
        // Given
        UUID processId = UUID.randomUUID();
        AdmissionProcess process = createProcess("old-token");
        process.setId(processId);
        process.setStatus(AdmissionStatus.LINK_GENERATED);
        String oldToken = process.getAccessToken();

        when(admissionRepository.findByTenantIdAndId(TENANT_ID, processId))
                .thenReturn(Optional.of(process));
        when(admissionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        AdmissionProcessResponse response = admissionService.resendLink(processId, 14, USER_ID);

        // Then
        assertThat(response.getAccessToken()).isNotEqualTo(oldToken);
        assertThat(response.getLinkExpiresAt()).isAfter(LocalDateTime.now().plusDays(13));

        verify(admissionRepository).save(argThat(p ->
                !p.getAccessToken().equals(oldToken) &&
                p.getLinkAccessedAt() == null
        ));
    }

    @Test
    @DisplayName("Deve cancelar processo de admissão")
    void shouldCancelAdmissionProcess() {
        // Given
        UUID processId = UUID.randomUUID();
        AdmissionProcess process = createProcess("token");
        process.setId(processId);
        process.setStatus(AdmissionStatus.DATA_FILLING);
        process.setNotes("");

        when(admissionRepository.findByTenantIdAndId(TENANT_ID, processId))
                .thenReturn(Optional.of(process));
        when(admissionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        admissionService.cancelAdmission(processId, "Candidato desistiu", USER_ID);

        // Then
        verify(admissionRepository).save(argThat(p ->
                p.getStatus() == AdmissionStatus.CANCELLED &&
                p.getNotes().contains("CANCELADO") &&
                p.getCompletedBy().equals(USER_ID)
        ));
    }

    @Test
    @DisplayName("Não deve cancelar processo já concluído")
    void shouldNotCancelCompletedProcess() {
        // Given
        UUID processId = UUID.randomUUID();
        AdmissionProcess process = createProcess("token");
        process.setId(processId);
        process.setStatus(AdmissionStatus.COMPLETED);

        when(admissionRepository.findByTenantIdAndId(TENANT_ID, processId))
                .thenReturn(Optional.of(process));

        // When/Then
        assertThatThrownBy(() ->
                admissionService.cancelAdmission(processId, "Motivo", USER_ID))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("concluido");
    }

    @Test
    @DisplayName("Deve retornar estatísticas de admissão")
    void shouldReturnAdmissionStatistics() {
        // Given
        LocalDateTime start = LocalDateTime.now().minusMonths(1);
        LocalDateTime end = LocalDateTime.now();

        when(admissionRepository.countByTenantIdAndCreatedAtBetween(eq(TENANT_ID), any(), any()))
                .thenReturn(100L);
        when(admissionRepository.countByTenantIdAndStatusAndCreatedAtBetween(
                eq(TENANT_ID), eq(AdmissionStatus.COMPLETED), any(), any()))
                .thenReturn(75L);
        when(admissionRepository.countByTenantIdAndStatusAndCreatedAtBetween(
                eq(TENANT_ID), eq(AdmissionStatus.CANCELLED), any(), any()))
                .thenReturn(10L);
        when(admissionRepository.countByTenantIdAndStatusNotInAndCreatedAtBetween(
                eq(TENANT_ID), anyList(), any(), any()))
                .thenReturn(15L);

        // When
        Map<String, Object> stats = admissionService.getStatistics(null, null);

        // Then
        assertThat(stats.get("total")).isEqualTo(100L);
        assertThat(stats.get("completed")).isEqualTo(75L);
        assertThat(stats.get("cancelled")).isEqualTo(10L);
        assertThat(stats.get("inProgress")).isEqualTo(15L);
        assertThat((Double) stats.get("completionRate")).isEqualTo(75.0);
    }

    @Test
    @DisplayName("Deve contar processos por status")
    void shouldCountProcessesByStatus() {
        // Given
        when(admissionRepository.countByTenantIdAndStatus(eq(TENANT_ID), any()))
                .thenReturn(5L);

        // When
        Map<AdmissionStatus, Long> counts = admissionService.countByStatus();

        // Then
        assertThat(counts).isNotEmpty();
        assertThat(counts).containsKeys(AdmissionStatus.values());
    }

    @Test
    @DisplayName("Deve retornar documentos obrigatórios e seu status")
    void shouldReturnRequiredDocumentsStatus() {
        // Given
        String token = "valid-token";
        AdmissionProcess process = createProcess(token);
        process.setDocuments(new ArrayList<>());

        when(admissionRepository.findByAccessTokenWithDocuments(token))
                .thenReturn(Optional.of(process));

        // When
        Map<String, Object> result = admissionService.getRequiredDocumentsStatus(token);

        // Then
        assertThat(result).containsKey("requirements");
        assertThat(result.get("allRequiredUploaded")).isEqualTo(false);
        assertThat(result.get("totalRequired")).isEqualTo(4);
    }

    // Helper methods

    private AdmissionProcessRequest createRequest() {
        return AdmissionProcessRequest.builder()
                .candidateName(CANDIDATE_NAME)
                .candidateEmail(CANDIDATE_EMAIL)
                .candidateCpf(CANDIDATE_CPF)
                .candidatePhone("11999999999")
                .expectedHireDate(LocalDate.now().plusDays(30))
                .build();
    }

    private AdmissionProcess createProcess(String token) {
        AdmissionProcess process = new AdmissionProcess();
        process.setId(UUID.randomUUID());
        process.setTenantId(TENANT_ID);
        process.setAccessToken(token);
        process.setCandidateName(CANDIDATE_NAME);
        process.setCandidateEmail(CANDIDATE_EMAIL);
        process.setCandidateCpf(CANDIDATE_CPF);
        process.setStatus(AdmissionStatus.LINK_GENERATED);
        process.setCurrentStep(1);
        process.setLinkExpiresAt(LocalDateTime.now().plusDays(7));
        process.setCreatedAt(LocalDateTime.now());
        process.setDocuments(new ArrayList<>());
        return process;
    }
}
