package com.axonrh.integration.esocial.service;

import com.axonrh.integration.certificate.entity.DigitalCertificate;
import com.axonrh.integration.certificate.repository.DigitalCertificateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;

import javax.xml.crypto.dsig.*;
import javax.xml.crypto.dsig.dom.DOMSignContext;
import javax.xml.crypto.dsig.keyinfo.KeyInfo;
import javax.xml.crypto.dsig.keyinfo.KeyInfoFactory;
import javax.xml.crypto.dsig.keyinfo.X509Data;
import javax.xml.crypto.dsig.spec.C14NMethodParameterSpec;
import javax.xml.crypto.dsig.spec.TransformParameterSpec;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.ByteArrayInputStream;
import java.io.StringReader;
import java.io.StringWriter;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.*;

/**
 * Transmissor de eventos eSocial para o governo.
 * Responsavel pela assinatura digital e envio dos XMLs.
 */
@Service
public class ESocialTransmitter {

    private static final Logger log = LoggerFactory.getLogger(ESocialTransmitter.class);

    @Value("${esocial.ambiente:2}")
    private int ambiente; // 1 = Producao, 2 = Producao Restrita (Homologacao)

    @Value("${esocial.webservice.envio:https://webservices.producaorestrita.esocial.gov.br/servicos/empregador/enviarloteeventos/WsEnviarLoteEventos.svc}")
    private String webserviceEnvio;

    @Value("${esocial.webservice.consulta:https://webservices.producaorestrita.esocial.gov.br/servicos/empregador/consultarloteeventos/WsConsultarLoteEventos.svc}")
    private String webserviceConsulta;

    private final DigitalCertificateRepository certificateRepository;
    private final HttpClient httpClient;

    public ESocialTransmitter(DigitalCertificateRepository certificateRepository) {
        this.certificateRepository = certificateRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    /**
     * Assina o XML com certificado digital A1.
     */
    public String signXml(String xml, UUID tenantId) throws Exception {
        DigitalCertificate cert = certificateRepository
                .findActiveCertificate(tenantId)
                .orElseThrow(() -> new IllegalStateException("Certificado digital ativo não encontrado"));

        KeyStore keyStore = loadKeyStore(cert);
        String alias = keyStore.aliases().nextElement();
        PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias, cert.getPassword().toCharArray());
        X509Certificate x509Cert = (X509Certificate) keyStore.getCertificate(alias);

        // Parse XML
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        Document doc = dbf.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));

        // Create XMLSignature
        XMLSignatureFactory fac = XMLSignatureFactory.getInstance("DOM");

        // Create Reference
        Reference ref = fac.newReference(
                "",
                fac.newDigestMethod(DigestMethod.SHA256, null),
                Collections.singletonList(
                        fac.newTransform(Transform.ENVELOPED, (TransformParameterSpec) null)
                ),
                null,
                null
        );

        // Create SignedInfo
        SignedInfo si = fac.newSignedInfo(
                fac.newCanonicalizationMethod(CanonicalizationMethod.INCLUSIVE, (C14NMethodParameterSpec) null),
                fac.newSignatureMethod("http://www.w3.org/2001/04/xmldsig-more#rsa-sha256", null),
                Collections.singletonList(ref)
        );

        // Create KeyInfo
        KeyInfoFactory kif = fac.getKeyInfoFactory();
        List<Object> x509Content = new ArrayList<>();
        x509Content.add(x509Cert);
        X509Data xd = kif.newX509Data(x509Content);
        KeyInfo ki = kif.newKeyInfo(Collections.singletonList(xd));

        // Sign the document
        DOMSignContext dsc = new DOMSignContext(privateKey, doc.getDocumentElement());
        XMLSignature signature = fac.newXMLSignature(si, ki);
        signature.sign(dsc);

        // Convert back to String
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer trans = tf.newTransformer();
        StringWriter sw = new StringWriter();
        trans.transform(new DOMSource(doc), new StreamResult(sw));

        return sw.toString();
    }

    /**
     * Envia lote de eventos para o eSocial.
     */
    public TransmissionResult sendBatch(String signedXml, UUID tenantId) throws Exception {
        DigitalCertificate cert = certificateRepository
                .findActiveCertificate(tenantId)
                .orElseThrow(() -> new IllegalStateException("Certificado digital ativo não encontrado"));

        // Build SOAP envelope
        String soapEnvelope = buildSoapEnvelope(signedXml);

        // Configure SSL with client certificate
        // In production, would use SSLContext with the certificate
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(webserviceEnvio))
                .header("Content-Type", "application/soap+xml; charset=utf-8")
                .header("SOAPAction", "http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0/ServicoEnviarLoteEventos/EnviarLoteEventos")
                .POST(HttpRequest.BodyPublishers.ofString(soapEnvelope))
                .timeout(Duration.ofSeconds(60))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return parseResponse(response.body());
        } catch (Exception e) {
            log.error("Erro ao transmitir lote eSocial: {}", e.getMessage());
            throw new RuntimeException("Falha na transmissão para o eSocial: " + e.getMessage(), e);
        }
    }

    /**
     * Consulta resultado do processamento de um lote.
     */
    public TransmissionResult consultBatch(String protocolNumber, UUID tenantId) throws Exception {
        String soapEnvelope = buildConsultSoapEnvelope(protocolNumber);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(webserviceConsulta))
                .header("Content-Type", "application/soap+xml; charset=utf-8")
                .header("SOAPAction", "http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0/ServicoConsultarLoteEventos/ConsultarLoteEventos")
                .POST(HttpRequest.BodyPublishers.ofString(soapEnvelope))
                .timeout(Duration.ofSeconds(60))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return parseConsultResponse(response.body());
        } catch (Exception e) {
            log.error("Erro ao consultar lote eSocial: {}", e.getMessage());
            throw new RuntimeException("Falha na consulta ao eSocial: " + e.getMessage(), e);
        }
    }

    private KeyStore loadKeyStore(DigitalCertificate cert) throws Exception {
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        keyStore.load(new ByteArrayInputStream(cert.getCertificateData()), cert.getPassword().toCharArray());
        return keyStore;
    }

    private String buildSoapEnvelope(String signedXml) {
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                               xmlns:v1="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0">
                    <soap:Header/>
                    <soap:Body>
                        <v1:EnviarLoteEventos>
                            <v1:loteEventos>
                                %s
                            </v1:loteEventos>
                        </v1:EnviarLoteEventos>
                    </soap:Body>
                </soap:Envelope>
                """.formatted(signedXml);
    }

    private String buildConsultSoapEnvelope(String protocolNumber) {
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                               xmlns:v1="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0">
                    <soap:Header/>
                    <soap:Body>
                        <v1:ConsultarLoteEventos>
                            <v1:consulta>
                                <eSocial xmlns="http://www.esocial.gov.br/schema/consulta/lote/eventos/retorno/v1_0_0">
                                    <consultaLoteEventos>
                                        <protocoloEnvio>%s</protocoloEnvio>
                                    </consultaLoteEventos>
                                </eSocial>
                            </v1:consulta>
                        </v1:ConsultarLoteEventos>
                    </soap:Body>
                </soap:Envelope>
                """.formatted(protocolNumber);
    }

    private TransmissionResult parseResponse(String responseXml) {
        // In production, would parse the XML response properly
        TransmissionResult result = new TransmissionResult();

        if (responseXml.contains("cdResposta>201")) {
            result.setSuccess(true);
            result.setStatus("ACCEPTED");
            // Extract protocol number
            int start = responseXml.indexOf("<protocoloEnvio>") + 16;
            int end = responseXml.indexOf("</protocoloEnvio>");
            if (start > 16 && end > start) {
                result.setProtocolNumber(responseXml.substring(start, end));
            }
        } else if (responseXml.contains("cdResposta>202")) {
            result.setSuccess(true);
            result.setStatus("PROCESSING");
        } else {
            result.setSuccess(false);
            result.setStatus("REJECTED");
            // Extract error message
            int start = responseXml.indexOf("<descResposta>") + 14;
            int end = responseXml.indexOf("</descResposta>");
            if (start > 14 && end > start) {
                result.setErrorMessage(responseXml.substring(start, end));
            }
        }

        return result;
    }

    private TransmissionResult parseConsultResponse(String responseXml) {
        TransmissionResult result = new TransmissionResult();

        if (responseXml.contains("cdResposta>1")) {
            result.setSuccess(true);
            result.setStatus("PROCESSED");
            // Extract receipt number
            int start = responseXml.indexOf("<nrRecibo>") + 10;
            int end = responseXml.indexOf("</nrRecibo>");
            if (start > 10 && end > start) {
                result.setReceiptNumber(responseXml.substring(start, end));
            }
        } else if (responseXml.contains("cdResposta>2")) {
            result.setSuccess(false);
            result.setStatus("PROCESSING");
            result.setErrorMessage("Lote ainda em processamento");
        } else {
            result.setSuccess(false);
            result.setStatus("ERROR");
        }

        return result;
    }

    /**
     * Resultado da transmissao.
     */
    public static class TransmissionResult {
        private boolean success;
        private String status;
        private String protocolNumber;
        private String receiptNumber;
        private String errorMessage;

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getProtocolNumber() { return protocolNumber; }
        public void setProtocolNumber(String protocolNumber) { this.protocolNumber = protocolNumber; }

        public String getReceiptNumber() { return receiptNumber; }
        public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }

        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }
}
