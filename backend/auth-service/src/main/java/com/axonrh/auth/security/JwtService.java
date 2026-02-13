package com.axonrh.auth.security;

import com.axonrh.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Servico para geracao e validacao de tokens JWT.
 */
@Slf4j
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Gera um access token JWT para o usuario.
     */
    public String generateAccessToken(User user, String tenantName, UUID employeeId) {
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(accessTokenExpiration);

        List<String> roles = user.getRoles().stream()
                .map(role -> "ROLE_" + role.getName())
                .toList();

        List<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(permission -> permission.getResource() + ":" + permission.getAction())
                .distinct()
                .toList();

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("tenant_id", user.getTenantId().toString())
                .claim("tenant_name", tenantName)
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .claim("roles", roles)
                .claim("permissions", permissions)
                .claim("employee_id", employeeId != null ? employeeId.toString() : null)
                .issuer("http://axonrh-auth-service:8081")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Gera um refresh token.
     */
    public String generateRefreshToken() {
        return UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
    }

    /**
     * Valida um token JWT e retorna os claims.
     */
    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extrai o user ID do token.
     */
    public UUID extractUserId(String token) {
        Claims claims = validateToken(token);
        return UUID.fromString(claims.getSubject());
    }

    /**
     * Extrai o tenant ID do token.
     */
    public UUID extractTenantId(String token) {
        Claims claims = validateToken(token);
        return UUID.fromString(claims.get("tenant_id", String.class));
    }

    /**
     * Verifica se o token esta expirado.
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = validateToken(token);
            return claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    /**
     * Retorna o tempo de expiracao do access token em segundos.
     */
    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpiration / 1000;
    }

    /**
     * Retorna o tempo de expiracao do refresh token em milissegundos.
     */
    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpiration;
    }
}
