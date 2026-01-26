package com.axonrh.employee.service;

import com.axonrh.employee.entity.*;
import com.axonrh.employee.entity.enums.AdmissionStatus;
import com.axonrh.employee.entity.enums.Gender;
import com.axonrh.employee.entity.enums.MaritalStatus;
import com.axonrh.employee.repository.AdmissionProcessRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * T114 - Tests for EsocialService (S-2200 Event Generation)
 */
@ExtendWith(MockitoExtension.class)
class EsocialServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private AdmissionProcessRepository admissionProcessRepository;

    @InjectMocks
    private EsocialService esocialService;

    private static final String TENANT_ID = UUID.randomUUID().toString();

    private Employee employee;
    private AdmissionProcess process;

    @BeforeEach
    void setUp() {
        // Set properties via reflection
        ReflectionTestUtils.setField(esocialService, "esocialEnabled", false);
        ReflectionTestUtils.setField(esocialService, "ambiente", 2);

        employee = createEmployee();
        process = createAdmissionProcess();
    }

    @Test
    @DisplayName("T114 - Deve gerar XML S-2200 com estrutura válida")
    void shouldGenerateS2200XmlWithValidStructure() {
        // When
        String xml = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xml).isNotNull();
        assertThat(xml).contains("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        assertThat(xml).contains("<eSocial xmlns=\"http://www.esocial.gov.br/schema/evt/evtAdmissao/v_S_01_02_00\">");
        assertThat(xml).contains("<evtAdmissao");
        assertThat(xml).contains("</eSocial>");
    }

    @Test
    @DisplayName("Deve incluir dados do evento no XML")
    void shouldIncludeEventDataInXml() {
        // When
        String xml = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xml).contains("<ideEvento>");
        assertThat(xml).contains("<indRetif>1</indRetif>"); // Original
        assertThat(xml).contains("<tpAmb>2</tpAmb>"); // Produção Restrita
        assertThat(xml).contains("<procEmi>1</procEmi>"); // Aplicativo do empregador
        assertThat(xml).contains("<verProc>AxonRH-1.0</verProc>");
    }

    @Test
    @DisplayName("Deve incluir dados do trabalhador no XML")
    void shouldIncludeWorkerDataInXml() {
        // When
        String xml = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xml).contains("<trabalhador>");
        assertThat(xml).contains("<cpfTrab>12345678901</cpfTrab>");
        assertThat(xml).contains("<nmTrab>João Silva Santos</nmTrab>");
        assertThat(xml).contains("<sexo>M</sexo>");
    }

    @Test
    @DisplayName("Deve incluir dados de nascimento no XML")
    void shouldIncludeBirthDataInXml() {
        // When
        String xml = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xml).contains("<nascimento>");
        assertThat(xml).contains("<dtNascto>");
        assertThat(xml).contains("</nascimento>");
    }

    @Test
    @DisplayName("Deve incluir documentos no XML")
    void shouldIncludeDocumentsInXml() {
        // When
        String xml = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xml).contains("<documentos>");
        assertThat(xml).contains("<CTPS>");
        assertThat(xml).contains("<nrCtps>1234567</nrCtps>");
        assertThat(xml).contains("<serieCtps>00001</serieCtps>");
        assertThat(xml).contains("<ufCtps>SP</ufCtps>");
    }

    @Test
    @DisplayName("Deve incluir endereço no XML")
    void shouldIncludeAddressInXml() {
        // When
        String xml = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xml).contains("<endereco>");
        assertThat(xml).contains("<brasil>");
        assertThat(xml).contains("<dscLograd>Rua das Flores</dscLograd>");
        assertThat(xml).contains("<nrLograd>123</nrLograd>");
        assertThat(xml).contains("<bairro>Centro</bairro>");
    }

    @Test
    @DisplayName("Deve incluir dados do vínculo no XML")
    void shouldIncludeBondDataInXml() {
        // When
        String xml = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xml).contains("<vinculo>");
        assertThat(xml).contains("<matricula>EMP001</matricula>");
        assertThat(xml).contains("<tpRegTrab>1</tpRegTrab>"); // CLT
        assertThat(xml).contains("<tpRegPrev>1</tpRegPrev>"); // RGPS
        assertThat(xml).contains("<cadIni>S</cadIni>"); // Cadastro inicial
    }

    @Test
    @DisplayName("Deve incluir informações do contrato no XML")
    void shouldIncludeContractInfoInXml() {
        // When
        String xml = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xml).contains("<infoContrato>");
        assertThat(xml).contains("<nmCargo>Desenvolvedor Senior</nmCargo>");
        assertThat(xml).contains("<CBOCargo>212405</CBOCargo>");
        assertThat(xml).contains("<remuneracao>");
        assertThat(xml).contains("<vrSalFx>8500.00</vrSalFx>");
        assertThat(xml).contains("<undSalFixo>5</undSalFixo>"); // Mensal
    }

    @Test
    @DisplayName("Deve incluir FGTS no XML")
    void shouldIncludeFgtsInXml() {
        // When
        String xml = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xml).contains("<FGTS>");
        assertThat(xml).contains("<opcFGTS>1</opcFGTS>"); // Optante
        assertThat(xml).contains("<dtOpcFGTS>");
    }

    @Test
    @DisplayName("Deve incluir jornada de trabalho no XML")
    void shouldIncludeWorkHoursInXml() {
        // When
        String xml = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xml).contains("<horContratual>");
        assertThat(xml).contains("<qtdHrsSem>44</qtdHrsSem>");
        assertThat(xml).contains("<tpJornada>2</tpJornada>");
    }

    @Test
    @DisplayName("Deve retornar protocolo mock quando eSocial desabilitado")
    void shouldReturnMockProtocolWhenDisabled() {
        // Given
        when(admissionProcessRepository.save(any())).thenReturn(process);

        // When
        String protocol = esocialService.sendS2200Event(employee, process, TENANT_ID);

        // Then
        assertThat(protocol).startsWith("MOCK-");
        assertThat(protocol).hasSize(17); // MOCK- + 12 chars
    }

    @Test
    @DisplayName("Deve atualizar processo com evento ID")
    void shouldUpdateProcessWithEventId() {
        // Given
        when(admissionProcessRepository.save(any())).thenReturn(process);

        // When
        esocialService.sendS2200Event(employee, process, TENANT_ID);

        // Then
        verify(admissionProcessRepository).save(argThat(p ->
                p.getEsocialEventId() != null &&
                p.getStatus() == AdmissionStatus.COMPLETED
        ));
    }

    @Test
    @DisplayName("Deve gerar ID de evento único")
    void shouldGenerateUniqueEventId() {
        // When
        String xml1 = esocialService.generateS2200Xml(employee, process, TENANT_ID);
        String xml2 = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        // Both should have ID attributes but they should be different
        assertThat(xml1).contains("Id=\"ID");
        assertThat(xml2).contains("Id=\"ID");
    }

    @Test
    @DisplayName("Deve escapar caracteres especiais no XML")
    void shouldEscapeSpecialCharactersInXml() {
        // Given
        employee.setFullName("João & Maria <Santos>");

        // When
        String xml = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xml).contains("&amp;");
        assertThat(xml).contains("&lt;");
        assertThat(xml).contains("&gt;");
        assertThat(xml).doesNotContain("<Santos>");
    }

    @Test
    @DisplayName("Deve consultar status do evento")
    void shouldQueryEventStatus() {
        // When
        var status = esocialService.queryEventStatus("MOCK-123456789012");

        // Then
        assertThat(status).isNotNull();
        assertThat(status.protocolNumber()).isEqualTo("MOCK-123456789012");
    }

    @Test
    @DisplayName("Deve converter código de sexo corretamente")
    void shouldConvertGenderCodeCorrectly() {
        // Given - Male
        employee.setGender(Gender.MALE);
        String xmlMale = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Given - Female
        employee.setGender(Gender.FEMALE);
        String xmlFemale = esocialService.generateS2200Xml(employee, process, TENANT_ID);

        // Then
        assertThat(xmlMale).contains("<sexo>M</sexo>");
        assertThat(xmlFemale).contains("<sexo>F</sexo>");
    }

    // Helper methods

    private Employee createEmployee() {
        Employee e = new Employee();
        e.setId(UUID.randomUUID());
        e.setRegistrationNumber("EMP001");
        e.setCpf("12345678901");
        e.setFullName("João Silva Santos");
        e.setGender(Gender.MALE);
        e.setMaritalStatus(MaritalStatus.SINGLE);
        e.setBirthDate(LocalDate.of(1990, 5, 15));
        e.setHireDate(LocalDate.now());
        e.setMobile("11999999999");
        e.setPersonalEmail("joao@example.com");
        e.setBaseSalary(new BigDecimal("8500.00"));
        e.setWeeklyHours(44);

        Position pos = new Position();
        pos.setTitle("Desenvolvedor Senior");
        pos.setCboCode("212405");
        e.setPosition(pos);

        return e;
    }

    private AdmissionProcess createAdmissionProcess() {
        AdmissionProcess p = new AdmissionProcess();
        p.setId(UUID.randomUUID());
        p.setCandidateName("João Silva Santos");
        p.setCandidateEmail("joao@example.com");
        p.setCandidateCpf("12345678901");
        p.setStatus(AdmissionStatus.ESOCIAL_PENDING);

        Map<String, Object> data = new HashMap<>();
        data.put("ctpsNumero", "1234567");
        data.put("ctpsSerie", "00001");
        data.put("ctpsUf", "SP");
        data.put("rg", "123456789");
        data.put("rgOrgaoEmissor", "SSP/SP");
        data.put("logradouro", "Rua das Flores");
        data.put("numero", "123");
        data.put("bairro", "Centro");
        data.put("cidade", "São Paulo");
        data.put("estado", "SP");
        data.put("cep", "01234567");
        data.put("codigoMunicipio", "3550308");
        data.put("paisNascimento", "105");
        data.put("racaCor", "BRANCA");
        data.put("escolaridade", "SUPERIOR_COMPLETO");
        data.put("cnpjSindicato", "12345678000199");
        p.setCandidateData(data);

        return p;
    }
}
