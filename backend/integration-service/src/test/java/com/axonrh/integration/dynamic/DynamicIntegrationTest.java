package com.axonrh.integration.dynamic;

import com.axonrh.integration.dynamic.entity.IntegrationConfig;
import com.axonrh.integration.dynamic.repository.IntegrationConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@org.testcontainers.junit.jupiter.Testcontainers
class DynamicIntegrationTest {

    @org.testcontainers.junit.jupiter.Container
    static org.testcontainers.containers.PostgreSQLContainer<?> postgres = new org.testcontainers.containers.PostgreSQLContainer<>("postgres:15-alpine");

    @org.springframework.test.context.DynamicPropertySource
    static void configureProperties(org.springframework.test.context.DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private IntegrationConfigRepository configRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldExecuteIntegrationSuccessfully() throws Exception {
        // 1. Criar Configuração
        IntegrationConfig config = new IntegrationConfig();
        config.setName("HttpBinTest");
        config.setTargetUrl("https://httpbin.org/post");
        config.setHttpMethod("POST");
        config.setHeadersTemplate("{\"X-Test-Header\": \"${headerValue}\"}");
        config.setBodyTemplate("{\"message\": \"Hello ${name}!\"}");
        config.setActive(true);
        configRepository.save(config);

        // 2. Dados da execução
        Map<String, Object> data = Map.of(
                "name", "Integration World",
                "headerValue", "12345"
        );

        // 3. Executar via API
        mockMvc.perform(post("/api/integrations/execute/HttpBinTest")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(data)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS")) // Sucesso porque httpbin retorna 200
                .andExpect(jsonPath("$.requestPayload").value("{\"message\": \"Hello Integration World!\"}"))
                .andExpect(jsonPath("$.requestHeaders").value("{\"X-Test-Header\": \"12345\"}"));
    }
}
