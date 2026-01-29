package com.axonrh.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        jwt = authHeader.substring(7);
        try {
            // Valida o token e verifica se nao esta expirado
            if (!jwtService.isTokenExpired(jwt)) {
                var claims = jwtService.validateToken(jwt);
                String userId = claims.getSubject();
                
                // Extrai roles do token
                @SuppressWarnings("unchecked")
                List<String> roles = claims.get("roles", List.class);
                
                if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    var authorities = roles.stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
                            
                    // Cria objeto de autenticacao usando o ID do usuario como principal
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            authorities
                    );
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // Define o contexto de seguranca
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("Usuario autenticado via JWT: {}", userId);
                }
            }
        } catch (Exception e) {
            log.error("Nao foi possivel autenticar via JWT: {}", e.getMessage());
            // Nao lanca excecao para permitir que request anonimo continue (se permitido) 
            // ou falhe no security chain
        }
        
        filterChain.doFilter(request, response);
    }
}
