package com.axonrh.employee.service;

import com.axonrh.employee.entity.AdmissionProcess;
import com.axonrh.employee.entity.ContractTemplate;
import com.axonrh.employee.entity.Department;
import com.axonrh.employee.entity.Position;
import com.axonrh.employee.exception.ResourceNotFoundException;
import com.axonrh.employee.repository.ContractTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for generating employment contracts from templates.
 * Handles variable substitution, PDF generation, and contract storage.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContractService {

    private final ContractTemplateRepository contractTemplateRepository;
    private final StorageService storageService;

    @Value("${contract.signature.api.url:http://localhost:8091/api/signature}")
    private String signatureApiUrl;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_EXTENSO_FORMATTER = DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", new Locale("pt", "BR"));
    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));

    /**
     * Generate contract for admission process
     */
    public String generateContract(AdmissionProcess process, String tenantId) {
        log.info("Generating contract for admission process: {}", process.getId());

        // Find appropriate template
        ContractTemplate template = findTemplate(process, tenantId);

        // Generate HTML content with variables replaced
        String htmlContent = processTemplate(template.getTemplateContent(), process);

        // Convert to PDF and store
        byte[] pdfContent = generatePdf(htmlContent);

        // Store in MinIO
        String storagePath = storeContract(pdfContent, process.getId(), tenantId);

        log.info("Contract generated and stored at: {}", storagePath);
        return storagePath;
    }

    /**
     * Find appropriate contract template
     */
    private ContractTemplate findTemplate(AdmissionProcess process, String tenantId) {
        // First try to find tenant-specific template for the contract type
        String contractType = determineContractType(process);
        UUID tenantUuid = tenantId != null ? UUID.fromString(tenantId) : null;

        return findTemplateForTenant(tenantUuid, contractType)
            .or(() -> findTemplateForTenant(null, contractType))
            .or(() -> findTemplateForTenant(null, "CLT"))
            .orElseThrow(() -> new ResourceNotFoundException("Template de contrato não encontrado"));
    }

    private java.util.Optional<ContractTemplate> findTemplateForTenant(UUID tenantId, String contractType) {
        if (tenantId != null) {
            var defaultTemplate = contractTemplateRepository
                .findByTenantIdAndContractTypeAndIsDefaultTrue(tenantId, contractType);
            if (defaultTemplate.isPresent()) {
                return defaultTemplate;
            }
        }

        return contractTemplateRepository.findByTenantIdAndContractTypeAndIsActiveTrue(tenantId, contractType)
            .stream()
            .findFirst();
    }

    /**
     * Determine contract type based on process data
     */
    private String determineContractType(AdmissionProcess process) {
        Map<String, Object> data = process.getCandidateData();
        if (data == null) {
            return "CLT";
        }

        String contractType = (String) data.get("tipoContrato");
        if (contractType != null) {
            return contractType.toUpperCase();
        }

        return "CLT";
    }

    /**
     * Process template by replacing all variables
     */
    public String processTemplate(String templateContent, AdmissionProcess process) {
        String result = templateContent;
        Map<String, Object> data = process.getCandidateData();

        // Basic candidate info
        result = replaceVariable(result, "NOME", process.getCandidateName());
        result = replaceVariable(result, "CPF", formatCpf(process.getCandidateCpf()));
        result = replaceVariable(result, "EMAIL", process.getCandidateEmail());

        // Department and Position
        Department dept = process.getDepartment();
        Position pos = process.getPosition();

        if (dept != null) {
            result = replaceVariable(result, "DEPARTAMENTO", dept.getName());
        }
        if (pos != null) {
            result = replaceVariable(result, "CARGO", pos.getTitle());
            result = replaceVariable(result, "CBO", pos.getCboCode() != null ? pos.getCboCode() : "");
        }

        // Salary (from position or candidate data)
        BigDecimal salary = pos != null && pos.getSalaryRangeMin() != null ?
            pos.getSalaryRangeMin() :
            data != null && data.get("salario") != null ?
                new BigDecimal(data.get("salario").toString()) : BigDecimal.ZERO;

        result = replaceVariable(result, "SALARIO", CURRENCY_FORMAT.format(salary));
        result = replaceVariable(result, "SALARIO_EXTENSO", valorPorExtenso(salary));

        // Work hours
        Integer workHours = data != null && data.get("weeklyHours") != null ?
            Integer.parseInt(data.get("weeklyHours").toString()) : 44;
        result = replaceVariable(result, "JORNADA", workHours + " horas semanais");
        result = replaceVariable(result, "CARGA_HORARIA", workHours.toString());

        // Dates
        LocalDate admissionDate = process.getExpectedHireDate() != null ?
            process.getExpectedHireDate() : LocalDate.now();
        result = replaceVariable(result, "DATA_ADMISSAO", admissionDate.format(DATE_FORMATTER));
        result = replaceVariable(result, "DATA_ADMISSAO_EXTENSO", admissionDate.format(DATE_EXTENSO_FORMATTER));
        result = replaceVariable(result, "DATA_ATUAL", LocalDate.now().format(DATE_FORMATTER));
        result = replaceVariable(result, "DATA_ATUAL_EXTENSO", LocalDate.now().format(DATE_EXTENSO_FORMATTER));

        // Extract data from candidate form
        if (data != null) {
            // Personal documents
            result = replaceVariable(result, "RG", getStringValue(data, "rg", ""));
            result = replaceVariable(result, "RG_ORGAO", getStringValue(data, "rgOrgaoEmissor", ""));
            result = replaceVariable(result, "CTPS", getStringValue(data, "ctpsNumero", ""));
            result = replaceVariable(result, "CTPS_SERIE", getStringValue(data, "ctpsSerie", ""));
            result = replaceVariable(result, "CTPS_UF", getStringValue(data, "ctpsUf", ""));
            result = replaceVariable(result, "PIS", getStringValue(data, "pis", ""));

            // Address
            result = replaceVariable(result, "ENDERECO", buildFullAddress(data));
            result = replaceVariable(result, "LOGRADOURO", getStringValue(data, "logradouro", ""));
            result = replaceVariable(result, "NUMERO", getStringValue(data, "numero", ""));
            result = replaceVariable(result, "COMPLEMENTO", getStringValue(data, "complemento", ""));
            result = replaceVariable(result, "BAIRRO", getStringValue(data, "bairro", ""));
            result = replaceVariable(result, "CIDADE", getStringValue(data, "cidade", ""));
            result = replaceVariable(result, "ESTADO", getStringValue(data, "estado", ""));
            result = replaceVariable(result, "CEP", getStringValue(data, "cep", ""));

            // Personal info
            result = replaceVariable(result, "DATA_NASCIMENTO", getStringValue(data, "dataNascimento", ""));
            result = replaceVariable(result, "NACIONALIDADE", getStringValue(data, "nacionalidade", "Brasileira"));
            result = replaceVariable(result, "ESTADO_CIVIL", getStringValue(data, "estadoCivil", ""));
            result = replaceVariable(result, "SEXO", getStringValue(data, "sexo", ""));
            result = replaceVariable(result, "ESCOLARIDADE", getStringValue(data, "escolaridade", ""));

            // Bank info
            result = replaceVariable(result, "BANCO", getStringValue(data, "banco", ""));
            result = replaceVariable(result, "AGENCIA", getStringValue(data, "agencia", ""));
            result = replaceVariable(result, "CONTA", getStringValue(data, "conta", ""));
            result = replaceVariable(result, "TIPO_CONTA", getStringValue(data, "tipoConta", ""));
        }

        // Company info (would come from tenant configuration)
        result = replaceVariable(result, "EMPRESA", "{{EMPRESA}}");
        result = replaceVariable(result, "CNPJ_EMPRESA", "{{CNPJ_EMPRESA}}");
        result = replaceVariable(result, "ENDERECO_EMPRESA", "{{ENDERECO_EMPRESA}}");

        // Clean up any remaining unreplaced variables
        result = cleanUnreplacedVariables(result);

        return result;
    }

    /**
     * Replace a single variable in the template
     */
    private String replaceVariable(String content, String variable, String value) {
        if (value == null) {
            value = "";
        }
        // Handle both {{VAR}} and {{ VAR }} formats
        return content.replaceAll("\\{\\{\\s*" + variable + "\\s*\\}\\}", Matcher.quoteReplacement(value));
    }

    /**
     * Get string value from data map with default
     */
    private String getStringValue(Map<String, Object> data, String key, String defaultValue) {
        Object value = data.get(key);
        return value != null ? value.toString() : defaultValue;
    }

    /**
     * Build full address from data
     */
    private String buildFullAddress(Map<String, Object> data) {
        StringBuilder address = new StringBuilder();

        String logradouro = getStringValue(data, "logradouro", "");
        String numero = getStringValue(data, "numero", "");
        String complemento = getStringValue(data, "complemento", "");
        String bairro = getStringValue(data, "bairro", "");
        String cidade = getStringValue(data, "cidade", "");
        String estado = getStringValue(data, "estado", "");
        String cep = getStringValue(data, "cep", "");

        if (!logradouro.isEmpty()) {
            address.append(logradouro);
            if (!numero.isEmpty()) {
                address.append(", ").append(numero);
            }
            if (!complemento.isEmpty()) {
                address.append(" - ").append(complemento);
            }
        }
        if (!bairro.isEmpty()) {
            if (address.length() > 0) address.append(", ");
            address.append(bairro);
        }
        if (!cidade.isEmpty()) {
            if (address.length() > 0) address.append(" - ");
            address.append(cidade);
            if (!estado.isEmpty()) {
                address.append("/").append(estado);
            }
        }
        if (!cep.isEmpty()) {
            if (address.length() > 0) address.append(" - CEP: ");
            address.append(cep);
        }

        return address.toString();
    }

    /**
     * Clean unreplaced variables from template
     */
    private String cleanUnreplacedVariables(String content) {
        // Replace any remaining {{...}} with empty string, but log them
        Pattern pattern = Pattern.compile("\\{\\{\\s*([^}]+)\\s*\\}\\}");
        Matcher matcher = pattern.matcher(content);
        while (matcher.find()) {
            log.warn("Unreplaced variable in contract: {}", matcher.group(1));
        }
        return content.replaceAll("\\{\\{[^}]*\\}\\}", "");
    }

    /**
     * Format CPF with dots and dash
     */
    private String formatCpf(String cpf) {
        if (cpf == null || cpf.length() != 11) {
            return cpf != null ? cpf : "";
        }
        return cpf.substring(0, 3) + "." +
               cpf.substring(3, 6) + "." +
               cpf.substring(6, 9) + "-" +
               cpf.substring(9);
    }

    /**
     * Convert value to Brazilian Portuguese written form
     */
    private String valorPorExtenso(BigDecimal valor) {
        if (valor == null || valor.compareTo(BigDecimal.ZERO) == 0) {
            return "zero reais";
        }

        long inteiro = valor.longValue();
        int centavos = valor.remainder(BigDecimal.ONE).multiply(BigDecimal.valueOf(100)).intValue();

        StringBuilder resultado = new StringBuilder();
        resultado.append(numeroExtenso(inteiro));
        resultado.append(inteiro == 1 ? " real" : " reais");

        if (centavos > 0) {
            resultado.append(" e ");
            resultado.append(numeroExtenso(centavos));
            resultado.append(centavos == 1 ? " centavo" : " centavos");
        }

        return resultado.toString();
    }

    /**
     * Convert number to written form
     */
    private String numeroExtenso(long numero) {
        if (numero == 0) return "zero";

        String[] unidades = {"", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
                "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"};
        String[] dezenas = {"", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"};
        String[] centenas = {"", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"};

        StringBuilder resultado = new StringBuilder();

        if (numero >= 1000) {
            long milhares = numero / 1000;
            if (milhares == 1) {
                resultado.append("mil");
            } else {
                resultado.append(numeroExtenso(milhares)).append(" mil");
            }
            numero %= 1000;
            if (numero > 0) resultado.append(" ");
        }

        if (numero >= 100) {
            if (numero == 100) {
                resultado.append("cem");
            } else {
                resultado.append(centenas[(int) (numero / 100)]);
                numero %= 100;
                if (numero > 0) resultado.append(" e ");
            }
        }

        if (numero >= 20) {
            resultado.append(dezenas[(int) (numero / 10)]);
            numero %= 10;
            if (numero > 0) resultado.append(" e ");
        }

        if (numero > 0 && numero < 20) {
            resultado.append(unidades[(int) numero]);
        }

        return resultado.toString().trim();
    }

    /**
     * Generate PDF from HTML content
     */
    private byte[] generatePdf(String htmlContent) {
        // Wrap HTML with proper document structure
        String fullHtml = wrapWithHtmlDocument(htmlContent);

        // Use Flying Saucer or similar library for PDF generation
        // For now, return HTML as bytes (actual PDF generation requires additional library)
        // In production, use: ITextRenderer, Flying Saucer, or external service

        try {
            // Placeholder for actual PDF generation
            // Would use something like:
            // ITextRenderer renderer = new ITextRenderer();
            // renderer.setDocumentFromString(fullHtml);
            // renderer.layout();
            // ByteArrayOutputStream os = new ByteArrayOutputStream();
            // renderer.createPDF(os);
            // return os.toByteArray();

            return fullHtml.getBytes("UTF-8");
        } catch (Exception e) {
            log.error("Error generating PDF: {}", e.getMessage());
            throw new RuntimeException("Erro ao gerar PDF do contrato", e);
        }
    }

    /**
     * Wrap content with HTML document structure
     */
    private String wrapWithHtmlDocument(String content) {
        return """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Contrato de Trabalho</title>
                <style>
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 12pt;
                        line-height: 1.6;
                        margin: 2cm;
                        color: #000;
                    }
                    h1 {
                        text-align: center;
                        font-size: 16pt;
                        margin-bottom: 30px;
                    }
                    h2 {
                        font-size: 14pt;
                        margin-top: 20px;
                    }
                    p {
                        text-align: justify;
                        margin: 10px 0;
                    }
                    .signature-section {
                        margin-top: 50px;
                    }
                    .signature-line {
                        margin-top: 60px;
                        border-top: 1px solid #000;
                        width: 300px;
                        text-align: center;
                        padding-top: 5px;
                    }
                    .witness-section {
                        margin-top: 40px;
                    }
                    @page {
                        margin: 2cm;
                    }
                </style>
            </head>
            <body>
            %s
            </body>
            </html>
            """.formatted(content);
    }

    /**
     * Store contract in MinIO
     */
    private String storeContract(byte[] pdfContent, UUID processId, String tenantId) {
        String fileName = "contratos/" + processId + "/contrato_trabalho.pdf";
        return storageService.uploadFile(pdfContent, fileName, "application/pdf", tenantId);
    }

    /**
     * Get contract preview (HTML format)
     */
    public String getContractPreview(AdmissionProcess process, String tenantId) {
        ContractTemplate template = findTemplate(process, tenantId);
        String htmlContent = processTemplate(template.getTemplateContent(), process);
        return wrapWithHtmlDocument(htmlContent);
    }

    /**
     * Send contract for electronic signature
     */
    public String sendForSignature(String contractUrl, AdmissionProcess process) {
        log.info("Sending contract for signature: {}", contractUrl);

        // Integration with electronic signature service (e.g., DocuSign, ClickSign, D4Sign)
        // For now, return a mock signature request ID

        // In production, would call signature API:
        // SignatureRequest request = new SignatureRequest();
        // request.setDocumentUrl(contractUrl);
        // request.setSignerName(process.getCandidateName());
        // request.setSignerEmail(process.getCandidateEmail());
        // request.setSignerCpf(process.getCandidateCpf());
        // return signatureClient.createRequest(request);

        return "SIG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    /**
     * Check signature status
     */
    public boolean isContractSigned(String signatureRequestId) {
        // Check with signature service
        // return signatureClient.getStatus(signatureRequestId).isSigned();

        // Mock implementation
        return false;
    }
}
