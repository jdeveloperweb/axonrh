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
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.err.println(">>> [DEBUG-FILTER] Request: " + request.getMethod() + " " + request.getRequestURI());
            if (auth != null) {
                System.err.println(">>> [DEBUG-FILTER] Auth Class: " + auth.getClass().getName());
                System.err.println(">>> [DEBUG-FILTER] Principal: " + auth.getPrincipal());
                System.err.println(">>> [DEBUG-FILTER] Authorities: " + auth.getAuthorities());
                System.err.println(">>> [DEBUG-FILTER] Is Authenticated: " + auth.isAuthenticated());
            } else {
                System.err.println(">>> [DEBUG-FILTER] No Authentication object in context (Anonymous?)");
            }
        } catch (Exception e) {
            System.err.println(">>> [DEBUG-FILTER] Error inspecting security context: " + e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
}
