package com.axonrh.gateway.filter;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class LoggingFilterTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    @DisplayName("Deve adicionar X-Request-Id na resposta")
    void shouldAddRequestIdToResponse() {
        webTestClient.get()
                .uri("/actuator/health")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().exists("X-Request-Id");
    }

    @Test
    @DisplayName("Deve usar X-Request-Id fornecido no request")
    void shouldUseProvidedRequestId() {
        String customRequestId = "custom-request-id-12345";

        webTestClient.get()
                .uri("/actuator/health")
                .header("X-Request-Id", customRequestId)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals("X-Request-Id", customRequestId);
    }

    @Test
    @DisplayName("Deve processar requisicoes com diferentes metodos HTTP")
    void shouldProcessDifferentHttpMethods() {
        // GET
        webTestClient.get()
                .uri("/actuator/health")
                .exchange()
                .expectStatus().isOk();

        // OPTIONS (CORS preflight)
        webTestClient.options()
                .uri("/actuator/health")
                .exchange()
                .expectStatus().isOk();
    }
}
