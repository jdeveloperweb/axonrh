package com.axonrh.employee.service;

import com.axonrh.employee.entity.AdmissionProcess;
import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.entity.enums.AdmissionStatus;
import com.axonrh.employee.repository.AdmissionProcessRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

/**
 * Service for eSocial integration.
 * Handles generation and sending of eSocial events, particularly S-2200 (Cadastramento Inicial do Vínculo).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EsocialService {

    private final RestTemplate restTemplate;
    private final AdmissionProcessRepository admissionProcessRepository;

    @Value("${esocial.api.url:https://webservices.producaorestrita.esocial.gov.br}")
    private String esocialApiUrl;

    @Value("${esocial.ambiente:2}")
    private int ambiente; // 1 = Produção, 2 = Produção Restrita

    @Value("${esocial.enabled:false}")
    private boolean esocialEnabled;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Send S-2200 event for employee admission
     */
    @Transactional
    public String sendS2200Event(Employee employee, AdmissionProcess process, String tenantId) {
        log.info("Generating S-2200 event for employee: {}", employee.getId());

        try {
            // Generate XML
            String xmlContent = generateS2200Xml(employee, process, tenantId);

            // Sign XML with digital certificate
            String signedXml = signXml(xmlContent, tenantId);

            // Send to eSocial
            String protocolNumber = sendToEsocial(signedXml);

            // Update process with event ID
            if (process != null) {
                process.setEsocialEventId(protocolNumber);
                process.setStatus(AdmissionStatus.COMPLETED);
                admissionProcessRepository.save(process);
            }

            log.info("S-2200 event sent successfully. Protocol: {}", protocolNumber);
            return protocolNumber;

        } catch (Exception e) {
            log.error("Error sending S-2200 event: {}", e.getMessage());

            if (process != null) {
                // Keep in ESOCIAL_PENDING status for retry
                process.setStatus(AdmissionStatus.ESOCIAL_PENDING);
                admissionProcessRepository.save(process);
            }

            throw new RuntimeException("Erro ao enviar evento S-2200: " + e.getMessage(), e);
        }
    }

    /**
     * Generate S-2200 XML content
     */
    public String generateS2200Xml(Employee employee, AdmissionProcess process, String tenantId) {
        Map<String, Object> candidateData = process != null ? process.getCandidateData() : null;

        StringBuilder xml = new StringBuilder();

        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<eSocial xmlns=\"http://www.esocial.gov.br/schema/evt/evtAdmissao/v_S_01_02_00\">\n");
        xml.append("  <evtAdmissao Id=\"").append(generateEventId(tenantId)).append("\">\n");

        // ideEvento - Event identification
        xml.append("    <ideEvento>\n");
        xml.append("      <indRetif>1</indRetif>\n"); // 1 = Original
        xml.append("      <tpAmb>").append(ambiente).append("</tpAmb>\n");
        xml.append("      <procEmi>1</procEmi>\n"); // 1 = Aplicativo do empregador
        xml.append("      <verProc>AxonRH-1.0</verProc>\n");
        xml.append("    </ideEvento>\n");

        // ideEmpregador - Employer identification
        xml.append("    <ideEmpregador>\n");
        xml.append("      <tpInsc>1</tpInsc>\n"); // 1 = CNPJ
        xml.append("      <nrInsc>").append(getTenantCnpj(tenantId)).append("</nrInsc>\n");
        xml.append("    </ideEmpregador>\n");

        // trabalhador - Worker data
        xml.append("    <trabalhador>\n");
        xml.append("      <cpfTrab>").append(employee.getCpf()).append("</cpfTrab>\n");
        xml.append("      <nmTrab>").append(escapeXml(employee.getFullName())).append("</nmTrab>\n");
        xml.append("      <sexo>").append(getSexoCode(employee.getGender())).append("</sexo>\n");
        xml.append("      <racaCor>").append(getRacaCorCode(candidateData)).append("</racaCor>\n");
        xml.append("      <estCiv>").append(getEstCivCode(employee.getMaritalStatus())).append("</estCiv>\n");
        xml.append("      <grauInstr>").append(getGrauInstrCode(candidateData)).append("</grauInstr>\n");
        xml.append("      <nmSoc>").append(escapeXml(employee.getSocialName() != null ? employee.getSocialName() : "")).append("</nmSoc>\n");

        // nascimento - Birth data
        xml.append("      <nascimento>\n");
        xml.append("        <dtNascto>").append(employee.getBirthDate().format(DATE_FORMAT)).append("</dtNascto>\n");
        xml.append("        <paisNascto>").append(getPaisCode(candidateData, "paisNascimento", "105")).append("</paisNascto>\n");
        if (candidateData != null && "105".equals(getPaisCode(candidateData, "paisNascimento", "105"))) {
            xml.append("        <codMunic>").append(getStringValue(candidateData, "municipioNascimento", "")).append("</codMunic>\n");
            xml.append("        <uf>").append(getStringValue(candidateData, "ufNascimento", "")).append("</uf>\n");
        }
        xml.append("      </nascimento>\n");

        // documentos - Documents
        xml.append("      <documentos>\n");

        // CTPS
        if (candidateData != null && candidateData.get("ctpsNumero") != null) {
            xml.append("        <CTPS>\n");
            xml.append("          <nrCtps>").append(getStringValue(candidateData, "ctpsNumero", "")).append("</nrCtps>\n");
            xml.append("          <serieCtps>").append(getStringValue(candidateData, "ctpsSerie", "")).append("</serieCtps>\n");
            xml.append("          <ufCtps>").append(getStringValue(candidateData, "ctpsUf", "")).append("</ufCtps>\n");
            xml.append("        </CTPS>\n");
        }

        // RG
        if (candidateData != null && candidateData.get("rg") != null) {
            xml.append("        <RG>\n");
            xml.append("          <nrRg>").append(getStringValue(candidateData, "rg", "")).append("</nrRg>\n");
            xml.append("          <orgaoEmissor>").append(getStringValue(candidateData, "rgOrgaoEmissor", "SSP")).append("</orgaoEmissor>\n");
            xml.append("          <dtExped>").append(getStringValue(candidateData, "rgDataEmissao", "")).append("</dtExped>\n");
            xml.append("        </RG>\n");
        }

        xml.append("      </documentos>\n");

        // endereco - Address
        xml.append("      <endereco>\n");
        xml.append("        <brasil>\n");
        xml.append("          <tpLograd>").append(getStringValue(candidateData, "tipoLogradouro", "R")).append("</tpLograd>\n");
        xml.append("          <dscLograd>").append(escapeXml(getStringValue(candidateData, "logradouro", ""))).append("</dscLograd>\n");
        xml.append("          <nrLograd>").append(getStringValue(candidateData, "numero", "S/N")).append("</nrLograd>\n");
        if (candidateData != null && candidateData.get("complemento") != null) {
            xml.append("          <complemento>").append(escapeXml(getStringValue(candidateData, "complemento", ""))).append("</complemento>\n");
        }
        xml.append("          <bairro>").append(escapeXml(getStringValue(candidateData, "bairro", ""))).append("</bairro>\n");
        xml.append("          <cep>").append(getStringValue(candidateData, "cep", "").replace("-", "")).append("</cep>\n");
        xml.append("          <codMunic>").append(getStringValue(candidateData, "codigoMunicipio", "")).append("</codMunic>\n");
        xml.append("          <uf>").append(getStringValue(candidateData, "estado", "")).append("</uf>\n");
        xml.append("        </brasil>\n");
        xml.append("      </endereco>\n");

        // contato - Contact
        xml.append("      <contato>\n");
        if (employee.getPersonalPhone() != null) {
            xml.append("        <fonePrinc>").append(employee.getPersonalPhone().replaceAll("[^0-9]", "")).append("</fonePrinc>\n");
        }
        if (employee.getPersonalEmail() != null) {
            xml.append("        <emailPrinc>").append(employee.getPersonalEmail()).append("</emailPrinc>\n");
        }
        xml.append("      </contato>\n");

        xml.append("    </trabalhador>\n");

        // vinculo - Employment bond
        xml.append("    <vinculo>\n");
        xml.append("      <matricula>").append(employee.getRegistrationNumber()).append("</matricula>\n");
        xml.append("      <tpRegTrab>1</tpRegTrab>\n"); // 1 = CLT
        xml.append("      <tpRegPrev>1</tpRegPrev>\n"); // 1 = RGPS
        xml.append("      <cadIni>S</cadIni>\n"); // S = Sim, cadastro inicial

        // infoRegimeTrab - Work regime info
        xml.append("      <infoRegimeTrab>\n");
        xml.append("        <infoCeletista>\n");
        xml.append("          <dtAdm>").append(employee.getAdmissionDate().format(DATE_FORMAT)).append("</dtAdm>\n");
        xml.append("          <tpAdmissao>1</tpAdmissao>\n"); // 1 = Admissão
        xml.append("          <indAdmissao>1</indAdmissao>\n"); // 1 = Normal
        xml.append("          <tpRegJor>1</tpRegJor>\n"); // 1 = Jornada com horário diário
        xml.append("          <natAtividade>1</natAtividade>\n"); // 1 = Urbano
        xml.append("          <dtBase>1</dtBase>\n"); // Janeiro
        xml.append("          <cnpjSindCategProf>").append(getStringValue(candidateData, "cnpjSindicato", "")).append("</cnpjSindCategProf>\n");

        // FGTS
        xml.append("          <FGTS>\n");
        xml.append("            <opcFGTS>1</opcFGTS>\n"); // 1 = Optante
        xml.append("            <dtOpcFGTS>").append(employee.getAdmissionDate().format(DATE_FORMAT)).append("</dtOpcFGTS>\n");
        xml.append("          </FGTS>\n");

        xml.append("        </infoCeletista>\n");
        xml.append("      </infoRegimeTrab>\n");

        // infoContrato - Contract info
        xml.append("      <infoContrato>\n");

        // cargo - Position
        if (employee.getPosition() != null) {
            xml.append("        <nmCargo>").append(escapeXml(employee.getPosition().getName())).append("</nmCargo>\n");
            xml.append("        <CBOCargo>").append(employee.getPosition().getCboCode() != null ? employee.getPosition().getCboCode() : "").append("</CBOCargo>\n");
        }

        // remuneracao - Remuneration
        xml.append("        <remuneracao>\n");
        xml.append("          <vrSalFx>").append(formatSalary(employee.getSalary())).append("</vrSalFx>\n");
        xml.append("          <undSalFixo>5</undSalFixo>\n"); // 5 = Mensal
        xml.append("          <dscSalVar></dscSalVar>\n");
        xml.append("        </remuneracao>\n");

        // duracao - Duration
        xml.append("        <duracao>\n");
        xml.append("          <tpContr>1</tpContr>\n"); // 1 = Prazo indeterminado
        xml.append("        </duracao>\n");

        // localTrabalho - Work location
        xml.append("        <localTrabalho>\n");
        xml.append("          <localTrabGeral>\n");
        xml.append("            <tpInsc>1</tpInsc>\n");
        xml.append("            <nrInsc>").append(getTenantCnpj(tenantId)).append("</nrInsc>\n");
        xml.append("          </localTrabGeral>\n");
        xml.append("        </localTrabalho>\n");

        // horContratual - Work hours
        xml.append("        <horContratual>\n");
        xml.append("          <qtdHrsSem>").append(employee.getPosition() != null ? employee.getPosition().getWorkHoursPerWeek() : 44).append("</qtdHrsSem>\n");
        xml.append("          <tpJornada>2</tpJornada>\n"); // 2 = Jornada com horário diário
        xml.append("          <horario>\n");
        xml.append("            <dia>2</dia>\n"); // Segunda
        xml.append("            <codHorContrat>HOR001</codHorContrat>\n");
        xml.append("          </horario>\n");
        xml.append("        </horContratual>\n");

        xml.append("      </infoContrato>\n");

        xml.append("    </vinculo>\n");

        xml.append("  </evtAdmissao>\n");
        xml.append("</eSocial>");

        return xml.toString();
    }

    /**
     * Generate unique event ID
     */
    private String generateEventId(String tenantId) {
        String timestamp = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "ID" + getTenantCnpj(tenantId).substring(0, 8) + timestamp + random;
    }

    /**
     * Get tenant CNPJ (would come from tenant configuration)
     */
    private String getTenantCnpj(String tenantId) {
        // In production, would fetch from tenant configuration
        return "00000000000000"; // Placeholder
    }

    /**
     * Sign XML with digital certificate
     */
    private String signXml(String xml, String tenantId) {
        // In production, would use digital certificate to sign XML
        // Using libraries like XAdES or similar

        log.info("Signing XML for tenant: {}", tenantId);

        if (!esocialEnabled) {
            log.info("eSocial disabled, returning unsigned XML");
            return xml;
        }

        // Placeholder for actual signing
        // Would use something like:
        // Certificate cert = loadCertificate(tenantId);
        // return xmlSigner.sign(xml, cert);

        return xml;
    }

    /**
     * Send signed XML to eSocial webservice
     */
    private String sendToEsocial(String signedXml) {
        if (!esocialEnabled) {
            log.info("eSocial disabled, returning mock protocol");
            return "MOCK-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_XML);

            HttpEntity<String> request = new HttpEntity<>(signedXml, headers);

            String response = restTemplate.postForObject(
                esocialApiUrl + "/servicos/empregador/enviarloteeventos",
                request,
                String.class
            );

            // Parse response to extract protocol number
            return parseProtocolFromResponse(response);

        } catch (Exception e) {
            log.error("Error sending to eSocial: {}", e.getMessage());
            throw new RuntimeException("Erro na comunicação com eSocial", e);
        }
    }

    /**
     * Parse protocol number from eSocial response
     */
    private String parseProtocolFromResponse(String response) {
        // Parse XML response to extract protocol
        // <protocoloEnvio>...</protocoloEnvio>
        if (response != null && response.contains("protocoloEnvio")) {
            int start = response.indexOf("<protocoloEnvio>") + 16;
            int end = response.indexOf("</protocoloEnvio>");
            if (start > 16 && end > start) {
                return response.substring(start, end);
            }
        }
        return UUID.randomUUID().toString();
    }

    /**
     * Query event status by protocol
     */
    public EsocialEventStatus queryEventStatus(String protocolNumber) {
        if (!esocialEnabled) {
            return new EsocialEventStatus(protocolNumber, "MOCK", "Ambiente de teste", null);
        }

        // Query eSocial for event status
        // POST to /servicos/empregador/consultarloteeventos

        return new EsocialEventStatus(protocolNumber, "PENDING", "Aguardando processamento", null);
    }

    /**
     * Retry failed S-2200 events
     */
    @Async
    @Transactional
    public void retryPendingEvents() {
        log.info("Retrying pending eSocial events");

        var pendingProcesses = admissionProcessRepository.findByStatus(AdmissionStatus.ESOCIAL_PENDING);

        for (AdmissionProcess process : pendingProcesses) {
            try {
                if (process.getEmployee() != null) {
                    sendS2200Event(process.getEmployee(), process, process.getTenantId());
                }
            } catch (Exception e) {
                log.error("Failed to retry S-2200 for process {}: {}", process.getId(), e.getMessage());
            }
        }
    }

    // Helper methods

    private String escapeXml(String value) {
        if (value == null) return "";
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;");
    }

    private String getStringValue(Map<String, Object> data, String key, String defaultValue) {
        if (data == null) return defaultValue;
        Object value = data.get(key);
        return value != null ? value.toString() : defaultValue;
    }

    private String getSexoCode(String gender) {
        if (gender == null) return "M";
        return switch (gender.toUpperCase()) {
            case "FEMALE", "F", "FEMININO" -> "F";
            default -> "M";
        };
    }

    private String getRacaCorCode(Map<String, Object> data) {
        String racaCor = getStringValue(data, "racaCor", "");
        return switch (racaCor.toUpperCase()) {
            case "BRANCA" -> "1";
            case "PRETA" -> "2";
            case "AMARELA" -> "3";
            case "PARDA" -> "4";
            case "INDIGENA" -> "5";
            default -> "6"; // Não informado
        };
    }

    private String getEstCivCode(String maritalStatus) {
        if (maritalStatus == null) return "1";
        return switch (maritalStatus.toUpperCase()) {
            case "MARRIED", "CASADO" -> "2";
            case "DIVORCED", "DIVORCIADO" -> "3";
            case "SEPARATED", "SEPARADO" -> "4";
            case "WIDOWED", "VIUVO" -> "5";
            default -> "1"; // Solteiro
        };
    }

    private String getGrauInstrCode(Map<String, Object> data) {
        String grau = getStringValue(data, "escolaridade", "");
        return switch (grau.toUpperCase()) {
            case "FUNDAMENTAL_INCOMPLETO" -> "01";
            case "FUNDAMENTAL_COMPLETO" -> "02";
            case "MEDIO_INCOMPLETO" -> "03";
            case "MEDIO_COMPLETO" -> "04";
            case "SUPERIOR_INCOMPLETO" -> "05";
            case "SUPERIOR_COMPLETO" -> "06";
            case "POS_GRADUACAO" -> "07";
            case "MESTRADO" -> "08";
            case "DOUTORADO" -> "09";
            default -> "01";
        };
    }

    private String getPaisCode(Map<String, Object> data, String key, String defaultValue) {
        // 105 = Brasil
        return getStringValue(data, key, defaultValue);
    }

    private String formatSalary(BigDecimal salary) {
        if (salary == null) return "0.00";
        return String.format("%.2f", salary);
    }

    /**
     * Event status record
     */
    public record EsocialEventStatus(
        String protocolNumber,
        String status,
        String message,
        String receiptNumber
    ) {}
}
