package com.axonrh.gateway.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class JwtAuthFilterTest {

    @LocalServerPort
    private int port;

    @Autowired
    private WebTestClient webTestClient;

    private static final String JWT_SECRET = "test-jwt-secret-key-for-testing-purposes-only";
    private SecretKey secretKey;

    @BeforeEach
    void setUp() {
        secretKey = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
    }

    private String generateValidToken() {
        return Jwts.builder()
                .subject("user-123")
                .claim("tenant_id", "tenant-456")
                .claim("email", "user@example.com")
                .claim("roles", List.of("ROLE_USER", "ROLE_ADMIN"))
                .issuedAt(new Date())
                .expiration(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)))
                .signWith(secretKey)
                .compact();
    }

    private String generateExpiredToken() {
        return Jwts.builder()
                .subject("user-123")
                .claim("tenant_id", "tenant-456")
                .claim("email", "user@example.com")
                .claim("roles", List.of("ROLE_USER"))
                .issuedAt(Date.from(Instant.now().minus(2, ChronoUnit.HOURS)))
                .expiration(Date.from(Instant.now().minus(1, ChronoUnit.HOURS)))
                .signWith(secretKey)
                .compact();
    }

    @Test
    @DisplayName("Deve permitir acesso a rotas publicas sem token")
    void shouldAllowPublicRoutesWithoutToken() {
        webTestClient.get()
                .uri("/actuator/health")
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @DisplayName("Deve retornar 401 quando Authorization header esta ausente em rota protegida")
    void shouldReturn401WhenAuthorizationHeaderMissing() {
        webTestClient.get()
                .uri("/api/v1/employees")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    @DisplayName("Deve retornar 401 quando token esta expirado")
    void shouldReturn401WhenTokenExpired() {
        String expiredToken = generateExpiredToken();

        webTestClient.get()
                .uri("/api/v1/employees")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken)
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    @DisplayName("Deve retornar 401 quando token tem formato invalido")
    void shouldReturn401WhenTokenFormatInvalid() {
        webTestClient.get()
                .uri("/api/v1/employees")
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    @DisplayName("Deve retornar 401 quando Authorization header nao comeca com Bearer")
    void shouldReturn401WhenAuthorizationNotBearer() {
        webTestClient.get()
                .uri("/api/v1/employees")
                .header(HttpHeaders.AUTHORIZATION, "Basic abc123")
                .exchange()
                .expectStatus().isUnauthorized();
    }
}
