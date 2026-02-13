package com.axonrh.integration.dynamic.service;

import com.axonrh.integration.dynamic.entity.IntegrationConfig;
import com.axonrh.integration.dynamic.entity.IntegrationLog;
import com.axonrh.integration.dynamic.repository.IntegrationConfigRepository;
import com.axonrh.integration.dynamic.repository.IntegrationLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
public class DynamicIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(DynamicIntegrationService.class);

    private final IntegrationConfigRepository configRepository;
    private final IntegrationLogRepository logRepository;
    private final TemplateService templateService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public DynamicIntegrationService(IntegrationConfigRepository configRepository,
                                     IntegrationLogRepository logRepository,
                                     TemplateService templateService,
                                     ObjectMapper objectMapper) {
        this.configRepository = configRepository;
        this.logRepository = logRepository;
        this.templateService = templateService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Transactional
    public IntegrationLog executeIntegration(String configName, Map<String, Object> data) {
        IntegrationConfig config = configRepository.findByName(configName)
                .orElseThrow(() -> new IllegalArgumentException("Integração não encontrada: " + configName));

        if (!config.isActive()) {
            throw new IllegalStateException("Integração inativa: " + configName);
        }

        IntegrationLog integrationLog = new IntegrationLog();
        integrationLog.setIntegrationConfig(config);
        integrationLog.setCorrelationId(UUID.randomUUID().toString()); // Pode vir do data se necessário

        try {
            // 1. Renderizar URL
            String url = templateService.render(config.getName() + "_url", config.getTargetUrl(), data);
            
            // 2. Renderizar Headers
            String headersJson = templateService.render(config.getName() + "_headers", config.getHeadersTemplate(), data);
            
            // 3. Renderizar Body
            String body = templateService.render(config.getName() + "_body", config.getBodyTemplate(), data);

            integrationLog.setRequestPayload(body);
            integrationLog.setRequestHeaders(headersJson);

            // 4. Construir Request
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(config.getTimeoutSeconds()));

            // Adicionar Headers
            if (headersJson != null && !headersJson.isBlank()) {
                try {
                    Map<String, String> headers = objectMapper.readValue(headersJson, Map.class);
                    headers.forEach(requestBuilder::header);
                } catch (JsonProcessingException e) {
                    throw new RuntimeException("Erro ao processar JSON de headers", e);
                }
            }

            // Setar método e body
            switch (config.getHttpMethod().toUpperCase()) {
                case "POST" -> requestBuilder.POST(HttpRequest.BodyPublishers.ofString(body != null ? body : ""));
                case "PUT" -> requestBuilder.PUT(HttpRequest.BodyPublishers.ofString(body != null ? body : ""));
                case "GET" -> requestBuilder.GET();
                case "DELETE" -> requestBuilder.DELETE();
                case "PATCH" -> requestBuilder.method("PATCH", HttpRequest.BodyPublishers.ofString(body != null ? body : ""));
                default -> throw new IllegalArgumentException("Método HTTP não suportado: " + config.getHttpMethod());
            }

            // 5. Executar Request
            long startTime = System.currentTimeMillis();
            HttpResponse<String> response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
            long duration = System.currentTimeMillis() - startTime;

            // 6. Registrar Resposta
            integrationLog.setExecutionTimeMs(duration);
            integrationLog.setResponseStatus(response.statusCode());
            integrationLog.setResponsePayload(response.body());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                integrationLog.setStatus(IntegrationLog.Status.SUCCESS);
            } else {
                integrationLog.setStatus(IntegrationLog.Status.FAILED);
                integrationLog.setErrorMessage("HTTP Status: " + response.statusCode());
            }

        } catch (Exception e) {
            log.error("Erro na integração {}: {}", configName, e.getMessage(), e);
            integrationLog.setStatus(IntegrationLog.Status.FAILED);
            integrationLog.setErrorMessage(e.getMessage());
            integrationLog.setExecutionTimeMs(0L); // Ou calcular tempo até o erro
        }

        return logRepository.save(integrationLog);
    }
}
