package com.axonrh.employee.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class DebugSecurityFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            System.err.println(">>> [DEBUG-FILTER] (PRE-AUTH) Request: " + request.getMethod() + " " + request.getRequestURI());
            
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                System.err.println(">>> [DEBUG-FILTER] Token found (length=" + token.length() + ")");
                
                // Decode Header
                try {
                    String[] parts = token.split("\\.");
                    if (parts.length > 0) {
                        String headerJson = new String(java.util.Base64.getUrlDecoder().decode(parts[0]));
                        System.err.println(">>> [DEBUG-FILTER] JWT Header: " + headerJson);
                    }
                } catch (Exception e) {
                    System.err.println(">>> [DEBUG-FILTER] Failed to decode JWT header: " + e.getMessage());
                }
            } else {
                System.err.println(">>> [DEBUG-FILTER] No Authorization Bearer header found!");
            }

        } catch (Exception e) {
            System.err.println(">>> [DEBUG-FILTER] Error inspecting request: " + e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
}
