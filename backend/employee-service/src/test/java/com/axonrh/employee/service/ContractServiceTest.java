package com.axonrh.employee.service;

import com.axonrh.employee.entity.AdmissionProcess;
import com.axonrh.employee.entity.ContractTemplate;
import com.axonrh.employee.entity.Department;
import com.axonrh.employee.entity.Position;
import com.axonrh.employee.entity.enums.AdmissionStatus;
import com.axonrh.employee.repository.ContractTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * T112 - Tests for ContractService (Contract Generation)
 */
@ExtendWith(MockitoExtension.class)
class ContractServiceTest {

    @Mock
    private ContractTemplateRepository contractTemplateRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private ContractService contractService;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final String TEMPLATE_CONTENT = """
            <h1>CONTRATO DE TRABALHO</h1>
            <p>Contratado: {{NOME}}</p>
            <p>CPF: {{CPF}}</p>
            <p>Cargo: {{CARGO}}</p>
            <p>Departamento: {{DEPARTAMENTO}}</p>
            <p>Salário: {{SALARIO}}</p>
            <p>Data de Admissão: {{DATA_ADMISSAO}}</p>
            <p>Endereço: {{ENDERECO}}</p>
            """;

    private ContractTemplate template;
    private AdmissionProcess process;

    @BeforeEach
    void setUp() {
        template = new ContractTemplate();
        template.setId(UUID.randomUUID());
        template.setName("Contrato CLT Padrão");
        template.setContractType("CLT");
        template.setTemplateContent(TEMPLATE_CONTENT);
        template.setIsActive(true);

        process = createAdmissionProcess();
    }

    @Test
    @DisplayName("T112 - Deve processar template substituindo variáveis")
    void shouldProcessTemplateReplacingVariables() {
        // When
        String result = contractService.processTemplate(TEMPLATE_CONTENT, process);

        // Then
        assertThat(result).contains("João Silva Santos");
        assertThat(result).contains("123.456.789-01");
        assertThat(result).contains("Desenvolvedor Senior");
        assertThat(result).contains("Tecnologia da Informação");
        assertThat(result).doesNotContain("{{NOME}}");
        assertThat(result).doesNotContain("{{CPF}}");
        assertThat(result).doesNotContain("{{CARGO}}");
    }

    @Test
    @DisplayName("Deve formatar CPF corretamente")
    void shouldFormatCpfCorrectly() {
        // Given
        String templateWithCpf = "<p>CPF: {{CPF}}</p>";

        // When
        String result = contractService.processTemplate(templateWithCpf, process);

        // Then
        assertThat(result).contains("123.456.789-01");
    }

    @Test
    @DisplayName("Deve formatar salário em reais")
    void shouldFormatSalaryInReais() {
        // Given
        String templateWithSalary = "<p>Salário: {{SALARIO}}</p><p>Por extenso: {{SALARIO_EXTENSO}}</p>";

        // When
        String result = contractService.processTemplate(templateWithSalary, process);

        // Then
        assertThat(result).contains("R$");
        assertThat(result).satisfiesAnyOf(
                value -> assertThat(value).contains("5.000,00"),
                value -> assertThat(value).contains("5000,00")
        );
        assertThat(result.toLowerCase()).contains("cinco mil reais");
    }

    @Test
    @DisplayName("Deve substituir dados do endereço")
    void shouldReplaceAddressData() {
        // Given
        String templateWithAddress = """
                <p>Logradouro: {{LOGRADOURO}}</p>
                <p>Número: {{NUMERO}}</p>
                <p>Bairro: {{BAIRRO}}</p>
                <p>Cidade: {{CIDADE}}</p>
                <p>Estado: {{ESTADO}}</p>
                <p>CEP: {{CEP}}</p>
                """;

        // When
        String result = contractService.processTemplate(templateWithAddress, process);

        // Then
        assertThat(result).contains("Rua das Flores");
        assertThat(result).contains("123");
        assertThat(result).contains("Centro");
        assertThat(result).contains("São Paulo");
        assertThat(result).contains("SP");
        assertThat(result).contains("01234567");
    }

    @Test
    @DisplayName("Deve montar endereço completo")
    void shouldBuildFullAddress() {
        // Given
        String templateWithFullAddress = "<p>Endereço: {{ENDERECO}}</p>";

        // When
        String result = contractService.processTemplate(templateWithFullAddress, process);

        // Then
        assertThat(result).contains("Rua das Flores");
        assertThat(result).contains("123");
        assertThat(result).contains("Centro");
        assertThat(result).contains("São Paulo");
    }

    @Test
    @DisplayName("Deve substituir datas corretamente")
    void shouldReplaceDatesCorrectly() {
        // Given
        String templateWithDates = """
                <p>Data Admissão: {{DATA_ADMISSAO}}</p>
                <p>Data Atual: {{DATA_ATUAL}}</p>
                """;

        // When
        String result = contractService.processTemplate(templateWithDates, process);

        // Then
        assertThat(result).matches(".*\\d{2}/\\d{2}/\\d{4}.*"); // Contains date in dd/MM/yyyy format
        assertThat(result).doesNotContain("{{DATA_ADMISSAO}}");
        assertThat(result).doesNotContain("{{DATA_ATUAL}}");
    }

    @Test
    @DisplayName("Deve gerar contrato e armazenar no storage")
    void shouldGenerateContractAndStore() {
        // Given
        when(contractTemplateRepository.findByTenantIdAndContractTypeAndIsActiveTrue(any(), eq("CLT")))
                .thenReturn(java.util.List.of(template));
        when(storageService.uploadFile(any(byte[].class), anyString(), anyString(), anyString()))
                .thenReturn("contratos/" + process.getId() + "/contrato_trabalho.pdf");

        // When
        String storagePath = contractService.generateContract(process, TENANT_ID.toString());

        // Then
        assertThat(storagePath).contains("contrato_trabalho.pdf");
        verify(storageService).uploadFile(any(byte[].class), anyString(), eq("application/pdf"), eq(TENANT_ID.toString()));
    }

    @Test
    @DisplayName("Deve buscar template específico do tenant")
    void shouldFindTenantSpecificTemplate() {
        // Given
        when(contractTemplateRepository.findByTenantIdAndContractTypeAndIsActiveTrue(TENANT_ID, "CLT"))
                .thenReturn(java.util.List.of(template));
        when(storageService.uploadFile(any(byte[].class), anyString(), anyString(), anyString()))
                .thenReturn("path");

        // When
        contractService.generateContract(process, TENANT_ID.toString());

        // Then
        verify(contractTemplateRepository).findByTenantIdAndContractTypeAndIsActiveTrue(TENANT_ID, "CLT");
    }

    @Test
    @DisplayName("Deve usar template padrão se não existir específico")
    void shouldUseFallbackTemplate() {
        // Given
        when(contractTemplateRepository.findByTenantIdAndContractTypeAndIsActiveTrue(TENANT_ID, "CLT"))
                .thenReturn(java.util.List.of());
        when(contractTemplateRepository.findByTenantIdAndContractTypeAndIsActiveTrue(null, "CLT"))
                .thenReturn(java.util.List.of(template));
        when(storageService.uploadFile(any(byte[].class), anyString(), anyString(), anyString()))
                .thenReturn("path");

        // When
        contractService.generateContract(process, TENANT_ID.toString());

        // Then
        verify(contractTemplateRepository).findByTenantIdAndContractTypeAndIsActiveTrue(null, "CLT");
    }

    @Test
    @DisplayName("Deve gerar preview HTML do contrato")
    void shouldGenerateContractPreview() {
        // Given
        when(contractTemplateRepository.findByTenantIdAndContractTypeAndIsActiveTrue(any(), eq("CLT")))
                .thenReturn(java.util.List.of(template));

        // When
        String preview = contractService.getContractPreview(process, TENANT_ID.toString());

        // Then
        assertThat(preview).contains("<!DOCTYPE html>");
        assertThat(preview).contains("<html");
        assertThat(preview).contains("João Silva Santos");
        assertThat(preview).contains("CONTRATO DE TRABALHO");
    }

    @Test
    @DisplayName("Deve limpar variáveis não substituídas")
    void shouldCleanUnreplacedVariables() {
        // Given
        String templateWithUnknown = "<p>Nome: {{NOME}}</p><p>Desconhecido: {{VARIAVEL_INEXISTENTE}}</p>";

        // When
        String result = contractService.processTemplate(templateWithUnknown, process);

        // Then
        assertThat(result).contains("João Silva Santos");
        assertThat(result).doesNotContain("{{VARIAVEL_INEXISTENTE}}");
    }

    @Test
    @DisplayName("Deve converter valor para extenso corretamente")
    void shouldConvertValueToWords() {
        // Given
        Position positionWithDifferentSalary = new Position();
        positionWithDifferentSalary.setTitle("Gerente");
        positionWithDifferentSalary.setSalaryRangeMin(new BigDecimal("12500.50"));
        process.setPosition(positionWithDifferentSalary);

        String templateWithExtenso = "<p>{{SALARIO_EXTENSO}}</p>";

        // When
        String result = contractService.processTemplate(templateWithExtenso, process);

        // Then
        assertThat(result.toLowerCase())
                .contains("doze mil")
                .contains("quinhentos")
                .contains("reais")
                .contains("centavos");
    }

    // Helper methods

    private AdmissionProcess createAdmissionProcess() {
        AdmissionProcess p = new AdmissionProcess();
        p.setId(UUID.randomUUID());
        p.setCandidateName("João Silva Santos");
        p.setCandidateEmail("joao@example.com");
        p.setCandidateCpf("12345678901");
        p.setExpectedHireDate(LocalDate.now().plusDays(15));
        p.setStatus(AdmissionStatus.CONTRACT_PENDING);

        Department dept = new Department();
        dept.setName("Tecnologia da Informação");
        p.setDepartment(dept);

        Position pos = new Position();
        pos.setTitle("Desenvolvedor Senior");
        pos.setCboCode("212405");
        pos.setSalaryRangeMin(new BigDecimal("5000.00"));
        p.setPosition(pos);

        Map<String, Object> data = new HashMap<>();
        data.put("rg", "123456789");
        data.put("rgOrgaoEmissor", "SSP/SP");
        data.put("ctpsNumero", "1234567");
        data.put("ctpsSerie", "00001");
        data.put("ctpsUf", "SP");
        data.put("pis", "12345678901");
        data.put("logradouro", "Rua das Flores");
        data.put("numero", "123");
        data.put("complemento", "Apto 45");
        data.put("bairro", "Centro");
        data.put("cidade", "São Paulo");
        data.put("estado", "SP");
        data.put("cep", "01234567");
        data.put("dataNascimento", "15/05/1990");
        data.put("nacionalidade", "Brasileira");
        data.put("estadoCivil", "Solteiro");
        data.put("weeklyHours", 44);
        p.setCandidateData(data);

        return p;
    }
}
